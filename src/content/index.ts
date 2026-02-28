import './content.css';
import { walkDOM } from './dom-walker';
import {
  showLoading,
  replaceLoading,
  showError,
  removeAllTranslations,
  setDisplayMode,
} from './translator-ui';
import { enableHover, disableHover, updateHoverLang } from './hover-handler';
import { startObserving, stopObserving } from './mutation-observer';
import { createFloatingButton, updateFabState } from './floating-button';
import { showOnboardingIfNeeded } from './onboarding';
import { sendToBackground } from '@/shared/message-bus';
import { onSettingsChanged, getSettings, updateSettings } from '@/shared/storage';
import { TranslationResult } from '@/types/translation';
import { MessageToContent, MessageResponse } from '@/types/messages';
import { UserSettings, DisplayMode } from '@/types/settings';
import { TranslatableNode } from '@/types/dom';
import { logger } from '@/shared/logger';

let isActive = false;
let hoverEnabled = false;
let currentSettings: UserSettings | null = null;
let isTranslating = false; // guard against concurrent translate calls

const BATCH_SIZE = 10;

// Initialize
(async () => {
  currentSettings = await getSettings();
  setDisplayMode(currentSettings.displayMode);
  logger.info('Content script loaded');

  // Show onboarding if first time
  showOnboardingIfNeeded();

  // Create floating action button
  createFloatingButton({
    onTranslatePage: () => translatePage(),
    onRemoveTranslations: () => deactivate(),
    onToggleHover: (enabled) => {
      hoverEnabled = enabled;
      if (enabled && currentSettings) {
        enableHover(currentSettings.targetLang);
      } else {
        disableHover();
      }
    },
    onToggleMode: () => {
      if (!currentSettings) return;
      const newMode: DisplayMode = currentSettings.displayMode === 'replace' ? 'bilingual' : 'replace';
      currentSettings.displayMode = newMode;
      setDisplayMode(newMode);
      updateSettings({ displayMode: newMode });

      // If currently translating, re-translate with new mode
      if (isActive) {
        deactivate();
        translatePage();
      }
    },
    isActive: () => isActive,
    isHoverEnabled: () => hoverEnabled,
    getDisplayMode: () => currentSettings?.displayMode ?? 'replace',
  });

  // Listen for settings changes
  onSettingsChanged((newSettings) => {
    currentSettings = newSettings;
    setDisplayMode(newSettings.displayMode);
    if (isActive && hoverEnabled) {
      updateHoverLang(currentSettings.targetLang);
    }
    applyTranslationStyles(currentSettings);
  });
})();

// Listen for messages from background/popup
chrome.runtime.onMessage.addListener(
  (
    message: MessageToContent,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void
  ): boolean => {
    switch (message.type) {
      case 'TRANSLATE_PAGE':
        translatePage().then(() => sendResponse({ success: true, data: null }));
        return true;

      case 'TOGGLE_TRANSLATION':
        if (isActive) {
          deactivate();
          sendResponse({ success: true, data: { isActive: false } });
        } else {
          translatePage().then(() => {
            sendResponse({ success: true, data: { isActive: true } });
          });
          return true; // Keep channel open for async
        }
        return false;

      case 'REMOVE_TRANSLATIONS':
        deactivate();
        sendResponse({ success: true, data: null });
        return false;

      case 'TRANSLATE_SELECTION':
        if (message.payload?.text) {
          translateSelection(message.payload.text);
        }
        sendResponse({ success: true, data: null });
        return false;

      case 'SETTINGS_CHANGED': {
        const prevMode = currentSettings?.displayMode;
        currentSettings = message.payload;
        setDisplayMode(currentSettings.displayMode);
        applyTranslationStyles(currentSettings);

        // If display mode changed while translation is active, re-translate
        if (isActive && prevMode !== currentSettings.displayMode) {
          removeAllTranslations();
          translatePage().then(() => sendResponse({ success: true, data: null }));
          return true;
        }

        sendResponse({ success: true, data: null });
        return false;
      }

      default:
        return false;
    }
  }
);

async function translatePage(): Promise<void> {
  // Prevent concurrent translate calls (rapid clicks)
  if (isTranslating) {
    logger.info('Translation already in progress, skipping');
    return;
  }

  if (!currentSettings) {
    currentSettings = await getSettings();
    setDisplayMode(currentSettings.displayMode);
  }

  isActive = true;
  isTranslating = true;
  updateFabState();
  applyTranslationStyles(currentSettings);

  try {
    const nodes = walkDOM();
    logger.info(`Found ${nodes.length} translatable nodes`);

    if (nodes.length > 0) {
      await translateNodes(nodes, currentSettings.sourceLang, currentSettings.targetLang);
    }

    if (currentSettings.hoverMode || hoverEnabled) {
      enableHover(currentSettings.targetLang);
    }

    startObserving((newNodes) => {
      if (isActive && currentSettings) {
        translateNodes(newNodes, currentSettings.sourceLang, currentSettings.targetLang);
      }
    });
  } finally {
    isTranslating = false;
  }
}

async function translateNodes(
  nodes: TranslatableNode[],
  sourceLang: string,
  targetLang: string
): Promise<void> {
  if (nodes.length === 0) {
    logger.info('No translatable nodes found');
    return;
  }

  logger.info(`Translating ${nodes.length} nodes (${sourceLang} → ${targetLang})`);
  const loaders = nodes.map((node) => showLoading(node.element));

  let translatedCount = 0;
  const totalCount = nodes.length;

  for (let i = 0; i < nodes.length; i += BATCH_SIZE) {
    // Abort if deactivated mid-translation
    if (!isActive) {
      logger.info('Translation cancelled (deactivated)');
      return;
    }

    const batchNodes = nodes.slice(i, i + BATCH_SIZE);
    const batchLoaders = loaders.slice(i, i + BATCH_SIZE);
    const texts = batchNodes.map((n) => n.originalText);

    try {
      const response = await sendToBackground<TranslationResult>({
        type: 'TRANSLATE_REQUEST',
        payload: { texts, sourceLang, targetLang },
      }) as MessageResponse<TranslationResult>;

      if (!response) {
        logger.error('No response from background – service worker may have crashed');
        for (const loader of batchLoaders) {
          showError(loader, 'No response from background');
        }
        continue;
      }

      if (response.success) {
        const { translatedTexts } = response.data;
        for (let j = 0; j < batchNodes.length; j++) {
          const translated = translatedTexts[j];

          // Skip if translation is identical to original (same language)
          if (translated && translated.trim().toLowerCase() === batchNodes[j].originalText.trim().toLowerCase()) {
            // Remove the loader, restore original
            showError(batchLoaders[j], ''); // silently restore
            batchNodes[j].element.removeAttribute('data-immersive-translated');
          } else {
            replaceLoading(batchLoaders[j], translated, targetLang);
          }
          translatedCount++;
        }
        logger.info(`Progress: ${translatedCount}/${totalCount} nodes translated`);
      } else {
        logger.error('Translation failed:', response.error);
        for (const loader of batchLoaders) {
          showError(loader, response.error);
        }
      }
    } catch (err) {
      logger.error('Translation request error:', err);
      for (const loader of batchLoaders) {
        showError(loader, (err as Error).message);
      }
    }
  }

  logger.info(`Translation complete: ${translatedCount}/${totalCount} nodes`);
}

async function translateSelection(text: string): Promise<void> {
  if (!currentSettings) {
    currentSettings = await getSettings();
  }

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  const parentEl = range.commonAncestorContainer.parentElement;
  if (!parentEl) return;

  const loader = showLoading(parentEl);
  parentEl.setAttribute('data-immersive-translated', 'true');

  try {
    const response = await sendToBackground<TranslationResult>({
      type: 'TRANSLATE_REQUEST',
      payload: {
        texts: [text],
        sourceLang: currentSettings.sourceLang,
        targetLang: currentSettings.targetLang,
      },
    }) as MessageResponse<TranslationResult>;

    if (response.success) {
      replaceLoading(loader, response.data.translatedTexts[0], currentSettings.targetLang);
    } else {
      showError(loader, response.error);
    }
  } catch (err) {
    showError(loader, (err as Error).message);
  }
}

function deactivate(): void {
  isActive = false;
  isTranslating = false;
  updateFabState();
  removeAllTranslations();
  disableHover();
  stopObserving();
}

function applyTranslationStyles(settings: UserSettings): void {
  const style = settings.translationStyle;
  document.documentElement.style.setProperty('--it-font-size', `${style.fontSize}em`);
  document.documentElement.style.setProperty('--it-text-color', style.color);
  document.documentElement.style.setProperty('--it-border-color', style.borderColor);
  document.documentElement.style.setProperty('--it-font-style', style.italic ? 'italic' : 'normal');
}
