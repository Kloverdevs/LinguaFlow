import './content.css';
import './video-subtitles.css';
import './dictionary-popup.css';
import './selection-popup.css';
import './reading-mode.css';
import { initVideoSubtitles, updateVideoSubtitleLanguage } from './video-subtitles';
import { initLiveCaptions, updateLiveCaptionsLanguage } from './live-captions';
import { initPdfHandler, isPdfPage } from './pdf-handler';
import { toggleReadingMode } from './reading-mode';
import { setupDictionaryListener } from './dictionary-popup';
import { showSelectionPopup } from './selection-popup';
import { walkDOMAsync } from './dom-walker';
import {
  showLoading,
  replaceLoading,
  showError,
  removeAllTranslations,
  setDisplayMode,
  setDyslexiaFont,
} from './translator-ui';
import { enableHover, disableHover, updateHoverLang } from './hover-handler';
import { startObserving, stopObserving } from './mutation-observer';
import { createFloatingButton, updateFabState, updateFabLabels, updateFabSize, setFabVisible } from './floating-button';
import type { FabLabels } from './floating-button';
import { showOnboardingIfNeeded } from './onboarding';
import { showImageTranslationModal } from './image-translator';
import { sendToBackground } from '@/shared/message-bus';
import { onSettingsChanged, getSettings, updateSettings } from '@/shared/storage';
import { getActiveSiteRule } from '@/shared/site-rulesHelper';
import { getStrings } from '@/shared/i18n';
import { TranslationResult, TranslationEngine } from '@/types/translation';
import { MessageToContent, MessageResponse } from '@/types/messages';
import { UserSettings, DisplayMode } from '@/types/settings';
import { TranslatableNode } from '@/types/dom';
import { logger } from '@/shared/logger';
import { initProgressIndicator, showProgress, updateProgress, hideProgress } from './translation-progress';

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
    readerMode: t.readerMode,
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
  setDyslexiaFont(!!currentSettings.dyslexiaFont);
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
    onReaderMode: () => {
      toggleReadingMode();
    }
  }, getFabLabels(currentSettings), fabSize);

  // Apply FAB visibility
  if (currentSettings.fabEnabled === false) {
    setFabVisible(false);
  }

  // Initialize video subtitles (only activates on supported hostnames)
  initVideoSubtitles();
  
  // Initialize meeting live captions
  initLiveCaptions();

  // Initialize PDF handler
  initPdfHandler();

  // Initialize Dictionary popup listener
  setupDictionaryListener();

  // Listen for settings changes
  onSettingsChanged((newSettings) => {
    const prevHoverMode = currentSettings?.hoverMode;
    const prevLocale = currentSettings?.uiLocale;
    const prevFabSize = currentSettings?.fabSize;
    const prevFabEnabled = currentSettings?.fabEnabled;
    currentSettings = newSettings;
    setDisplayMode(newSettings.displayMode);
    setDyslexiaFont(!!newSettings.dyslexiaFont);

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
          const x = lastContextMenuPos.x || window.innerWidth / 2;
          const y = lastContextMenuPos.y || window.innerHeight / 2;
          showSelectionPopup(message.payload.text, x, y);
        }
        sendResponse({ success: true, data: null });
        return false;

      case 'TRANSLATE_IMAGE':
        if (message.payload?.srcUrl && currentSettings) {
          showImageTranslationModal(message.payload.srcUrl, currentSettings.sourceLang, currentSettings.targetLang);
        }
        sendResponse({ success: true, data: null });
        return false;

      case 'TOGGLE_HOVER_MODE':
        if (currentSettings) {
          const newHoverState = !hoverEnabled;
          hoverEnabled = newHoverState;
          if (newHoverState) {
            enableHover(currentSettings.targetLang);
          } else {
            disableHover();
          }
          updateSettings({ hoverMode: newHoverState });
        }
        sendResponse({ success: true, data: null });
        return false;

      case 'TRANSLATE_CURRENT_SELECTION': {
        const text = window.getSelection()?.toString().trim();
        if (text) {
          const x = lastContextMenuPos.x || window.innerWidth / 2;
          const y = lastContextMenuPos.y || window.innerHeight / 2;
          showSelectionPopup(text, x, y);
        }
        sendResponse({ success: true, data: null });
        return false;
      }

      case 'SETTINGS_CHANGED': {
        const prev = currentSettings;
        currentSettings = message.payload;
        setDisplayMode(currentSettings.displayMode);
        setDyslexiaFont(!!currentSettings.dyslexiaFont);
        applyTranslationStyles(currentSettings);

        // FAB visibility
        if (currentSettings.fabEnabled !== prev?.fabEnabled) {
          setFabVisible(currentSettings.fabEnabled !== false);
        }

        // FAB size
        if (currentSettings.fabSize !== prev?.fabSize) {
          updateFabSize(currentSettings.fabSize ?? 48);
        }

        // FAB labels (locale change)
        if (currentSettings.uiLocale !== prev?.uiLocale) {
          updateFabLabels(getFabLabels(currentSettings));
        }

        // Hover mode
        if (currentSettings.hoverMode && !prev?.hoverMode) {
          hoverEnabled = true;
          enableHover(currentSettings.targetLang);
        } else if (!currentSettings.hoverMode && prev?.hoverMode) {
          hoverEnabled = false;
          disableHover();
        }

        if (hoverEnabled) {
          updateHoverLang(currentSettings.targetLang);
        }

        // Update video subtitles language
        if (currentSettings.targetLang !== prev?.targetLang) {
          updateVideoSubtitleLanguage(currentSettings.targetLang);
          updateLiveCaptionsLanguage(currentSettings.targetLang);
        }

        // If display mode changed while translation is active, re-translate
        if (isActive && prev?.displayMode !== currentSettings.displayMode) {
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
  if (isPdfPage()) return; // PDF handles translation natively in its own side panel

  // Prevent concurrent translate calls (rapid clicks)
  if (isTranslating) {
    logger.info('Translation already in progress, skipping');
    return;
  }

  await initProgressIndicator();

  if (!currentSettings) {
    currentSettings = await getSettings();
    setDisplayMode(currentSettings.displayMode);
  }

  isActive = true;
  isTranslating = true;
  updateFabState();
  applyTranslationStyles(currentSettings);

  try {
    const nodes = await walkDOMAsync();
    logger.info(`Found ${nodes.length} translatable nodes`);

    const activeRule = getActiveSiteRule(currentSettings);
    const targetLang = activeRule?.targetLang || currentSettings.targetLang;
    const engine = activeRule?.engine;

    if (nodes.length > 0) {
      showProgress();
      await translateNodes(nodes, currentSettings.sourceLang, targetLang, engine);
      hideProgress();
    }

    if (currentSettings.hoverMode || hoverEnabled) {
      enableHover(currentSettings.targetLang);
    }

    startObserving((newNodes) => {
      if (isActive && currentSettings) {
        const ar = getActiveSiteRule(currentSettings);
        translateNodes(newNodes, currentSettings.sourceLang, ar?.targetLang || currentSettings.targetLang, ar?.engine);
      }
    });
  } finally {
    isTranslating = false;
  }
}

async function translateNodes(
  nodes: TranslatableNode[],
  sourceLang: string,
  targetLang: string,
  engine?: TranslationEngine
): Promise<void> {
  if (nodes.length === 0) {
    logger.info('No translatable nodes found');
    return;
  }

  logger.info(`Translating ${nodes.length} nodes (${sourceLang} → ${targetLang})`);
  const loaders = nodes.map((node) => showLoading(node.element));

  let translatedCount = 0;
  const totalCount = nodes.length;

  return new Promise<void>((resolve) => {
    const pendingIndices = new Set(nodes.map((_, i) => i));
    const priorityQueue: number[] = [];
    const normalQueue: number[] = [];
    let isProcessing = false;

    const observer = new IntersectionObserver((entries) => {
      let hasNew = false;
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const index = Number((entry.target as HTMLElement).dataset.itIndex);
          if (pendingIndices.has(index)) {
            pendingIndices.delete(index);
            priorityQueue.push(index);
            hasNew = true;
          }
          observer.unobserve(entry.target);
        }
      }
      if (hasNew) {
        processQueues();
      }
    }, { rootMargin: '500px' });

    loaders.forEach((loader, i) => {
      loader.dataset.itIndex = String(i);
      observer.observe(loader);
    });

    // After a short delay, push all remaining unobserved nodes to the normal queue
    // so everything gets translated eventually, even if off-screen.
        setTimeout(() => {
          for (const i of pendingIndices) {
            normalQueue.push(i);
            observer.unobserve(loaders[i]);
          }
          pendingIndices.clear();
          processQueues();
        }, 500);

        async function processQueues() {
          if (isProcessing || !isActive) return;
          isProcessing = true;

      try {
        while (priorityQueue.length > 0 || normalQueue.length > 0) {
          if (!isActive) {
            logger.info('Translation cancelled (deactivated)');
            break;
          }

          const batchIndices: number[] = [];
          while (batchIndices.length < BATCH_SIZE) {
            if (priorityQueue.length > 0) {
              batchIndices.push(priorityQueue.shift()!);
            } else if (normalQueue.length > 0) {
              batchIndices.push(normalQueue.shift()!);
            } else {
              break;
            }
          }

          if (batchIndices.length === 0) break;

          const batchNodes = batchIndices.map(i => nodes[i]);
          const batchLoaders = batchIndices.map(i => loaders[i]);
          const texts = batchNodes.map((n) => n.originalText);

          const SEPARATOR = '\\n---SPLIT---\\n';
          let accumulatedStream = '';
          const streamListener = (msg: any) => {
            if (msg.type === 'TRANSLATION_STREAM_CHUNK') {
              accumulatedStream += msg.payload.chunk;
              const parts = accumulatedStream.split(SEPARATOR.trim());
              for (let j = 0; j < parts.length && j < batchLoaders.length; j++) {
                if (parts[j]) {
                  replaceLoading(batchLoaders[j], parts[j], targetLang);
                }
              }
            }
          };
          chrome.runtime.onMessage.addListener(streamListener);

          try {
            const response = await sendToBackground<TranslationResult>({
              type: 'TRANSLATE_REQUEST',
              payload: { texts, sourceLang, targetLang, engine },
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
                if (translated && translated.trim().toLowerCase() === batchNodes[j].originalText.trim().toLowerCase()) {
                  showError(batchLoaders[j], '');
                  batchNodes[j].element.removeAttribute('data-immersive-translated');
                } else {
                  replaceLoading(batchLoaders[j], translated, targetLang);
                }
              }
              translatedCount += batchNodes.length;
              updateProgress(translatedCount, totalCount);
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
          } finally {
            chrome.runtime.onMessage.removeListener(streamListener);
          }
        }
      } finally {
        isProcessing = false;
        // Resolve the promise if all elements have been queued and processed
        if (priorityQueue.length === 0 && normalQueue.length === 0 && pendingIndices.size === 0) {
          observer.disconnect();
          resolve();
        }
      }
    }
  });
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
