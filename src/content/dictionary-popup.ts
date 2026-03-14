import { getSettings } from '@/shared/storage';
import { sendToBackground } from '@/shared/message-bus';
import { TranslationResult, TranslationEngine } from '@/types/translation';
import { saveVocabEntry } from '@/shared/vocab-store';
import { getActiveSiteRule } from '@/shared/site-rulesHelper';
import { setTrustedHTML, clearElement } from './safe-dom';

/** Small delay after double-click to ensure browser selection has updated */
const SELECTION_SETTLE_MS = 50;
/** Translation request timeout */
const TRANSLATE_TIMEOUT_MS = 15000;

let popupElement: HTMLElement | null = null;
let popupRequestId = 0;
let popupAbortController: AbortController | null = null;
let popupEscapeHandler: ((e: KeyboardEvent) => void) | null = null;

export function setupDictionaryListener() {
  document.addEventListener('dblclick', async (e) => {
    // Small delay to ensure browser selection updates
    setTimeout(async () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      
      // Only trigger for words or very short phrases (less than ~40 chars)
      if (!text || text.length === 0 || text.length > 40 || text.includes('\n')) return;

      const settings = await getSettings();
      // Only show if extension is globally active or hover mode is active
      // In professional setups, usually we'd have a specific "Dictionary Popup" setting
      if (!settings.hoverMode) return; 

      const activeRule = getActiveSiteRule(settings);
      const targetLang = activeRule?.targetLang || settings.targetLang;
      const engine = activeRule?.engine;

      showDictionaryPopup(text, e.clientX, e.clientY, settings.sourceLang, targetLang, engine);
    }, SELECTION_SETTLE_MS);
  });

  // Close popup when clicking outside
  document.addEventListener('mousedown', (e) => {
    if (popupElement && !popupElement.contains(e.target as Node)) {
      closePopup();
    }
  });
}

async function showDictionaryPopup(text: string, x: number, y: number, sourceLang: string, targetLang: string, engine?: TranslationEngine) {
  closePopup();
  popupAbortController = new AbortController();
  const signal = popupAbortController.signal;
  const requestId = ++popupRequestId;

  popupElement = document.createElement('div');
  popupElement.className = 'it-dictionary-card';
  
  // Basic bounding box check
  const maxX = window.innerWidth - 300;
  const maxY = window.innerHeight - 150;
  popupElement.style.left = `${Math.min(x, maxX)}px`;
  popupElement.style.top = `${Math.min(y + 20, maxY)}px`;

  // Build popup with safe DOM APIs to avoid XSS from selected text
  const headerDiv = document.createElement('div');
  headerDiv.className = 'it-dictionary-header';
  const sourceDiv = document.createElement('div');
  sourceDiv.className = 'it-dictionary-source';
  sourceDiv.textContent = text;
  headerDiv.appendChild(sourceDiv);

  const transDiv = document.createElement('div');
  transDiv.className = 'it-dictionary-translation';
  const loadingI = document.createElement('i');
  loadingI.textContent = 'Translating...';
  transDiv.appendChild(loadingI);

  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'it-dictionary-actions';
  setTrustedHTML(actionsDiv, `
    <button class="it-dict-btn listen-btn" aria-label="Listen to pronunciation" title="Listen">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
      Listen
    </button>
    <button class="it-dict-btn save-btn" aria-label="Save to vocabulary" title="Save">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z"/></svg>
      Save
    </button>
  `);

  popupElement.setAttribute('role', 'dialog');
  popupElement.setAttribute('aria-modal', 'true');
  popupElement.setAttribute('aria-label', 'Dictionary popup');
  popupElement.setAttribute('tabindex', '-1');
  transDiv.setAttribute('aria-live', 'polite');
  popupElement.appendChild(headerDiv);
  popupElement.appendChild(transDiv);
  popupElement.appendChild(actionsDiv);

  document.body.appendChild(popupElement);
  popupElement.focus();

  // Close on Escape key
  popupEscapeHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') closePopup();
  };
  document.addEventListener('keydown', popupEscapeHandler);

  const listenBtn = popupElement.querySelector('.listen-btn') as HTMLElement;
  const saveBtn = popupElement.querySelector('.save-btn') as HTMLElement;

  let currentTranslation = '';

  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Translation timed out')), TRANSLATE_TIMEOUT_MS)
    );
    const response = await Promise.race([
      sendToBackground<TranslationResult>({
        type: 'TRANSLATE_REQUEST',
        payload: { texts: [text], sourceLang, targetLang, engine },
      }),
      timeout,
    ]);

    if (requestId !== popupRequestId) return; // Stale response
    if (response && response.success && response.data.translatedTexts.length > 0) {
      currentTranslation = response.data.translatedTexts[0];
      transDiv.textContent = currentTranslation;
    } else {
      const errMsg = !response ? 'Translation failed' : (!response.success ? response.error : 'Translation failed');
      clearElement(transDiv);
      const i = document.createElement('i');
      i.style.color = 'red';
      i.textContent = errMsg;
      transDiv.appendChild(i);
    }
  } catch (err) {
    clearElement(transDiv);
    const i = document.createElement('i');
    i.style.color = 'red';
    i.textContent = 'Error connecting to service';
    transDiv.appendChild(i);
  }

  listenBtn.addEventListener('click', () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (sourceLang !== 'auto') utterance.lang = sourceLang;
      window.speechSynthesis.speak(utterance);
    }
  }, { signal });

  saveBtn.addEventListener('click', async () => {
    if (!currentTranslation) return;
    saveBtn.textContent = 'Saving...';
    try {
      await saveVocabEntry({
        text,
        translation: currentTranslation,
        sourceLang,
        targetLang,
        sourceUrl: window.location.href,
        context: text
      });
      saveBtn.classList.add('saved');
      saveBtn.textContent = 'Saved';
    } catch (e) {
      saveBtn.textContent = 'Error';
    }
  }, { signal });
}

function closePopup() {
  popupAbortController?.abort();
  popupAbortController = null;
  if (popupEscapeHandler) {
    document.removeEventListener('keydown', popupEscapeHandler);
    popupEscapeHandler = null;
  }
  if (popupElement) {
    popupElement.remove();
    popupElement = null;
  }
}
