import browser from 'webextension-polyfill';
import './content.css';
import './video-subtitles.css';
import './dictionary-popup.css';
import './selection-popup.css';
import './reading-mode.css';
import { initVideoSubtitles, updateVideoSubtitleLanguage } from './video-subtitles';
import { initLiveCaptions, updateLiveCaptionsLanguage } from './live-captions';
import { initPdfHandler, isPdfPage, startPdfTranslation } from './pdf-handler';
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
import { showImageTranslationModal } from './image-translator';
import { launchProductTour } from './product-tour';
import { sendToBackground } from '@/shared/message-bus';
import { onSettingsChanged, getSettings, updateSettings } from '@/shared/storage';
import { getActiveSiteRule } from '@/shared/site-rulesHelper';
import { getStrings } from '@/shared/i18n';
import { TranslationResult, TranslationEngine } from '@/types/translation';
import { MessageToContent, MessageResponse } from '@/types/messages';
import { UserSettings, DisplayMode } from '@/types/settings';
import { TranslatableNode } from '@/types/dom';
import { logger } from '@/shared/logger';
import {
  initProgressIndicator,
  showProgress,
  hideProgress,
  incrementProgress,
  setTotalNodes,
  showErrorProgress,
  setProgressCancelCallback,
} from './translation-progress';

let isActive = false;
let hoverEnabled = false;
let currentSettings: UserSettings | null = null;
let isTranslating = false; // guard against concurrent translate calls
let lastContextMenuPos = { x: 0, y: 0 };

const BATCH_SIZE = 10;
/** Delay before enqueuing off-screen nodes (short for PDFs, longer for normal pages) */
const OFFSCREEN_DELAY_MS = 500;
const OFFSCREEN_DELAY_PDF_MS = 50;

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
  const unsubSettings = onSettingsChanged((newSettings) => {
    const prevHoverMode = currentSettings?.hoverMode;
    const prevLocale = currentSettings?.uiLocale;
    const prevFabSize = currentSettings?.fabSize;
    const prevFabEnabled = currentSettings?.fabEnabled;
    currentSettings = newSettings;
    setDisplayMode(isPdfPage() ? 'replace' : newSettings.displayMode);
    setDyslexiaFont(!!newSettings.dyslexiaFont);

    // Enable/disable hover based on hoverMode setting (works independently of page translation)
    if (newSettings.hoverMode && !prevHoverMode && !isPdfPage()) {
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

  // Cleanup settings listener on page unload
  window.addEventListener('beforeunload', () => unsubSettings?.(), { once: true });

  // Enable hover on load if hoverMode is already enabled
  if (currentSettings.hoverMode && !isPdfPage()) {
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
browser.runtime.onMessage.addListener(((
    message: MessageToContent,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void
  ): boolean => {
    switch (message.type) {
      case '__PING__':
        sendResponse({ success: true, data: null });
        return false;

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
        const newSettings = message.payload as UserSettings;
        currentSettings = newSettings;
        setDisplayMode(newSettings.displayMode);
        setDyslexiaFont(!!newSettings.dyslexiaFont);
        applyTranslationStyles(newSettings);

        // FAB visibility
        if (newSettings.fabEnabled !== prev?.fabEnabled) {
          setFabVisible(newSettings.fabEnabled !== false);
        }

        // FAB size
        if (newSettings.fabSize !== prev?.fabSize) {
          updateFabSize(newSettings.fabSize ?? 48);
        }

        // FAB labels (locale change)
        if (newSettings.uiLocale !== prev?.uiLocale) {
          updateFabLabels(getFabLabels(newSettings));
        }

        // Hover mode
        if (newSettings.hoverMode && !prev?.hoverMode) {
          hoverEnabled = true;
          enableHover(newSettings.targetLang);
        } else if (!newSettings.hoverMode && prev?.hoverMode) {
          hoverEnabled = false;
          disableHover();
        }

        if (hoverEnabled) {
          updateHoverLang(newSettings.targetLang);
        }

        // Update video subtitles language
        if (newSettings.targetLang !== prev?.targetLang) {
          updateVideoSubtitleLanguage(newSettings.targetLang);
          updateLiveCaptionsLanguage(newSettings.targetLang);
        }

        // If display mode changed while translation is active, re-translate
        if (isActive && prev?.displayMode !== newSettings.displayMode) {
          removeAllTranslations();
          translatePage().then(() => sendResponse({ success: true, data: null }));
          return true;
        }

        sendResponse({ success: true, data: null });
        return false;
      }

      case 'EXECUTE_CHROME_BUILTIN': {
        handleChromeBuiltin(message.payload)
          .then((res) => sendResponse({ success: true, data: res }))
          .catch((err) => sendResponse({ success: false, error: err.message }));
        return true;
      }

      default:
        return false;
    }
  }) as Parameters<typeof browser.runtime.onMessage.addListener>[0]
);

async function handleChromeBuiltin(payload: { texts: string[]; sourceLang: string; targetLang: string }): Promise<string[]> {
  const api = window.translation || window.ai?.translator;
  if (!api) {
    throw new Error('Chrome Built-in Translator API is not available in your browser instance. Please enable the #translation-api flag in chrome://flags.');
  }

  const sl = payload.sourceLang === 'auto' ? 'en' : payload.sourceLang.split('-')[0];
  const tl = payload.targetLang.split('-')[0];

  let availability;
  try {
    availability = await api.canTranslate({ sourceLanguage: sl, targetLanguage: tl });
  } catch (e) {
    throw new Error(`Failed to check language support: ${(e as Error).message}`);
  }

  if (availability === 'no') {
    throw new Error(`Chrome cannot natively translate from ${sl} to ${tl}. Language pair not supported yet.`);
  }

  let translator = null;
  try {
    translator = await api.createTranslator({ sourceLanguage: sl, targetLanguage: tl });
    const results: string[] = [];
    for (const text of payload.texts) {
      if (!text.trim()) {
        results.push(text);
        continue;
      }
      results.push(await translator.translate(text));
    }
    return results;
  } finally {
    if (translator) translator.destroy();
  }
}

async function translatePage(): Promise<void> {
  if (isPdfPage()) {
    logger.info('Starting manual PDF translation...');
    await startPdfTranslation();
    // Proceed to translate the newly injected PDF text layers
  }

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
  setProgressCancelCallback(() => deactivate());

  try {
    const activeRule = getActiveSiteRule(currentSettings);
    const targetLang = activeRule?.targetLang || currentSettings.targetLang;
    const engine = activeRule?.engine;

    let totalNodesFound = 0;
    showProgress();

    // Stream the nodes in chunks of 50 to avoid the massive initial indexing delay
    await walkDOMAsync(undefined, async (nodesChunk) => {
      totalNodesFound += nodesChunk.length;
      setTotalNodes(totalNodesFound);
      
      logger.info(`Translating chunk of ${nodesChunk.length} nodes...`);
      // Fire and forget chunk translation so we don't block the walker
      translateNodes(nodesChunk, currentSettings!.sourceLang, targetLang, engine).catch(err => {
        logger.error('Error translating chunk:', err);
      });
    });

    logger.info(`Finished scanning. Total ${totalNodesFound} translatable nodes found`);
    if (totalNodesFound === 0) hideProgress();

    if (currentSettings.hoverMode || hoverEnabled) {
      enableHover(currentSettings.targetLang);
    }

    startObserving((newNodes) => {
      if (isActive && currentSettings) {
        const ar = getActiveSiteRule(currentSettings);
        translateNodes(newNodes, currentSettings.sourceLang, ar?.targetLang || currentSettings.targetLang, ar?.engine);
      }
    });
  } catch (err) {
    logger.error('Error during translatePage execution', err);
  } finally {
    isTranslating = false;
    setProgressCancelCallback(null);
  }
}

// Track elements currently in translation pipeline to prevent duplicate requests
const inFlightElements = new WeakSet<Element>();

async function translateNodes(
  nodes: TranslatableNode[],
  sourceLang: string,
  targetLang: string,
  engine?: TranslationEngine
): Promise<void> {
  // Filter out elements already being translated (prevents MutationObserver duplicates)
  const filtered = nodes.filter(n => !inFlightElements.has(n.element));
  if (filtered.length === 0) {
    return;
  }
  filtered.forEach(n => inFlightElements.add(n.element));

  logger.info(`Translating ${filtered.length} nodes (${sourceLang} → ${targetLang})`);
  const loaders = filtered.map((node) => showLoading(node.element));

  let translatedCount = 0;

  return new Promise<void>((resolve) => {
    const pendingIndices = new Set(filtered.map((_, i) => i));
    const priorityQueue: number[] = [];
    const normalQueue: number[] = [];
    let isProcessing = false;
    let observerDisconnected = false;

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
    }, { 
      root: document.getElementById('lf-pdf-root') || null,
      rootMargin: '500px' 
    });

    loaders.forEach((loader, i) => {
      loader.dataset.itIndex = String(i);
      observer.observe(loader);
    });

    const isPdfViewer = document.getElementById('lf-pdf-root') !== null;

    // After a short delay (or instantly for PDFs), push all remaining unobserved nodes to the normal queue
    // so everything gets translated eventually, even if off-screen.
    setTimeout(() => {
      if (observerDisconnected) return;
      for (const i of pendingIndices) {
        normalQueue.push(i);
        observer.unobserve(loaders[i]);
      }
      pendingIndices.clear();
      processQueues();
    }, isPdfViewer ? OFFSCREEN_DELAY_PDF_MS : OFFSCREEN_DELAY_MS);

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

          const batchNodes = batchIndices.map(i => filtered[i]);
          const batchLoaders = batchIndices.map(i => loaders[i]);
          const texts = batchNodes.map((n) => n.originalText);

          const SEPARATOR = '\\n---SPLIT---\\n';
          let accumulatedStream = '';
          const streamListener = (msg: { type: string; payload?: { chunk?: string } }) => {
            if (msg.type === 'TRANSLATION_STREAM_CHUNK' && msg.payload?.chunk) {
              accumulatedStream += msg.payload.chunk;
              const parts = accumulatedStream.split(SEPARATOR.trim());
              for (let j = 0; j < parts.length && j < batchLoaders.length; j++) {
                if (parts[j]) {
                  replaceLoading(batchLoaders[j], parts[j], targetLang);
                }
              }
            }
          };
          browser.runtime.onMessage.addListener(streamListener);

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
              incrementProgress(batchNodes.length);
              logger.info(`Progress: ${translatedCount} nodes translated in this chunk stream`);
            } else {
              logger.error('Translation failed:', response.error);
              showErrorProgress(response.error);
              for (const loader of batchLoaders) {
                showError(loader, response.error);
              }
            }
          } catch (err) {
            logger.error('Translation request error:', err);
            showErrorProgress((err as Error).message);
            for (const loader of batchLoaders) {
              showError(loader, (err as Error).message);
            }
          } finally {
            browser.runtime.onMessage.removeListener(streamListener);
          }
        }
      } finally {
        isProcessing = false;
        // Resolve the promise if all elements have been queued and processed
        if (priorityQueue.length === 0 && normalQueue.length === 0 && pendingIndices.size === 0) {
          if (!observerDisconnected) {
            observer.disconnect();
            observerDisconnected = true;
          }
          // Release in-flight tracking for processed elements
          filtered.forEach(n => inFlightElements.delete(n.element));
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
