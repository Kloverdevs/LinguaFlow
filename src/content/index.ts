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
import { createFloatingButton, updateFabState, updateFabLabels, updateFabSize, setFabVisible } from './floating-button';
import type { FabLabels } from './floating-button';
import { showOnboardingIfNeeded } from './onboarding';
import { sendToBackground } from '@/shared/message-bus';
import { onSettingsChanged, getSettings, updateSettings } from '@/shared/storage';
import { getStrings } from '@/shared/i18n';
import { TranslationResult } from '@/types/translation';
import { MessageToContent, MessageResponse } from '@/types/messages';
import { UserSettings, DisplayMode } from '@/types/settings';
import { TranslatableNode } from '@/types/dom';
import { logger } from '@/shared/logger';

let isActive = false;
let hoverEnabled = false;
let currentSettings: UserSettings | null = null;
let isTranslating = false; // guard against concurrent translate calls
let lastContextMenuPos = { x: 0, y: 0 };

const BATCH_SIZE = 10;

function getFabLabels(settings: UserSettings): FabLabels {
  const t = getStrings(settings.uiLocale ?? 'auto');
  return {
    translatePage: t.translatePage,
    restoreOriginal: t.restoreOriginal,
    bilingualMode: t.bilingualMode,
    hoverTranslate: t.hoverTranslate,
  };
}

// Track mouse position for context menu translation placement
document.addEventListener('contextmenu', (e) => {
  lastContextMenuPos = { x: e.clientX, y: e.clientY };
});

// Initialize
(async () => {
  currentSettings = await getSettings();
  setDisplayMode(currentSettings.displayMode);
  logger.info('Content script loaded');

  // Show onboarding if first time
  showOnboardingIfNeeded();

  const fabSize = currentSettings.fabSize ?? 48;

  // Create floating action button
  createFloatingButton({
    onTranslatePage: () => translatePage(),
    onRemoveTranslations: () => deactivate(),
    onToggleHover: (enabled) => {
      hoverEnabled = enabled;
      if (enabled && currentSettings) {
        enableHover(currentSettings.targetLang);
        updateSettings({ hoverMode: true });
      } else {
        disableHover();
        updateSettings({ hoverMode: false });
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
  }, getFabLabels(currentSettings), fabSize);

  // Apply FAB visibility
  if (currentSettings.fabEnabled === false) {
    setFabVisible(false);
  }

  // Listen for settings changes
  onSettingsChanged((newSettings) => {
    const prevHoverMode = currentSettings?.hoverMode;
    const prevLocale = currentSettings?.uiLocale;
    const prevFabSize = currentSettings?.fabSize;
    const prevFabEnabled = currentSettings?.fabEnabled;
    currentSettings = newSettings;
    setDisplayMode(newSettings.displayMode);

    // Enable/disable hover based on hoverMode setting (works independently of page translation)
    if (newSettings.hoverMode && !prevHoverMode) {
      hoverEnabled = true;
      enableHover(newSettings.targetLang);
    } else if (!newSettings.hoverMode && prevHoverMode) {
      hoverEnabled = false;
      disableHover();
    }

    if (hoverEnabled) {
      updateHoverLang(newSettings.targetLang);
    }

    // Update FAB labels when locale changes
    if (newSettings.uiLocale !== prevLocale) {
      updateFabLabels(getFabLabels(newSettings));
    }

    // Update FAB size
    if (newSettings.fabSize !== prevFabSize) {
      updateFabSize(newSettings.fabSize ?? 48);
    }

    // Update FAB visibility
    if (newSettings.fabEnabled !== prevFabEnabled) {
      setFabVisible(newSettings.fabEnabled !== false);
    }

    applyTranslationStyles(currentSettings);
  });

  // Enable hover on load if hoverMode is already enabled
  if (currentSettings.hoverMode) {
    hoverEnabled = true;
    enableHover(currentSettings.targetLang);
  }

  // Auto-translate if current site is in autoTranslateSites
  const hostname = window.location.hostname;
  const autoSites = currentSettings.autoTranslateSites ?? [];
  const neverSites = currentSettings.neverTranslateSites ?? [];
  if (autoSites.includes(hostname) && !neverSites.includes(hostname)) {
    logger.info(`Auto-translating site: ${hostname}`);
    // Wait for DOM to be ready before auto-translating
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => translatePage(), { once: true });
    } else {
      translatePage();
    }
  }
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

  // Show floating tooltip near the right-click position
  const tooltip = createSelectionTooltip(lastContextMenuPos.x, lastContextMenuPos.y);
  tooltip.textContent = '\u2026'; // loading ellipsis

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
      tooltip.textContent = response.data.translatedTexts[0];
      tooltip.classList.add('immersive-selection-ready');
    } else {
      tooltip.textContent = response.error ?? 'Translation failed';
      tooltip.classList.add('immersive-selection-error');
    }
  } catch (err) {
    tooltip.textContent = (err as Error).message;
    tooltip.classList.add('immersive-selection-error');
  }
}

function createSelectionTooltip(x: number, y: number): HTMLElement {
  // Remove any existing tooltip
  document.querySelector('.immersive-selection-tooltip')?.remove();

  const tooltip = document.createElement('div');
  tooltip.className = 'immersive-selection-tooltip';

  // Position near the right-click, clamped to viewport
  const maxX = window.innerWidth - 320;
  const maxY = window.innerHeight - 100;
  tooltip.style.left = `${Math.min(x, maxX)}px`;
  tooltip.style.top = `${Math.min(y + 10, maxY)}px`;

  document.body.appendChild(tooltip);

  // Close on click outside
  const closeHandler = (e: MouseEvent) => {
    if (!tooltip.contains(e.target as Node)) {
      tooltip.remove();
      document.removeEventListener('mousedown', closeHandler);
    }
  };
  setTimeout(() => document.addEventListener('mousedown', closeHandler), 100);

  return tooltip;
}

function deactivate(): void {
  isActive = false;
  isTranslating = false;
  updateFabState();
  removeAllTranslations();

  // Only disable hover if hoverMode setting is off
  if (!currentSettings?.hoverMode) {
    hoverEnabled = false;
    disableHover();
  }

  stopObserving();
}

function applyTranslationStyles(settings: UserSettings): void {
  const style = settings.translationStyle;
  document.documentElement.style.setProperty('--it-font-size', `${style.fontSize}em`);
  document.documentElement.style.setProperty('--it-font-family', style.fontFamily || 'inherit');
  document.documentElement.style.setProperty('--it-text-color', style.color);
  document.documentElement.style.setProperty('--it-border-color', style.borderColor);
  document.documentElement.style.setProperty('--it-font-style', style.italic ? 'italic' : 'normal');
}
