import { getSettings } from '@/shared/storage';
import { sendToBackground } from '@/shared/message-bus';
import { TranslationResult } from '@/types/translation';
import { saveVocabEntry } from '@/shared/vocab-store';
import { getActiveSiteRule } from '@/shared/site-rulesHelper';

let popupElement: HTMLElement | null = null;

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
    }, 50);
  });

  // Close popup when clicking outside
  document.addEventListener('mousedown', (e) => {
    if (popupElement && !popupElement.contains(e.target as Node)) {
      closePopup();
    }
  });
}

async function showDictionaryPopup(text: string, x: number, y: number, sourceLang: string, targetLang: string, engine: any) {
  closePopup();

  popupElement = document.createElement('div');
  popupElement.className = 'it-dictionary-card';
  
  // Basic bounding box check
  const maxX = window.innerWidth - 300;
  const maxY = window.innerHeight - 150;
  popupElement.style.left = `${Math.min(x, maxX)}px`;
  popupElement.style.top = `${Math.min(y + 20, maxY)}px`;

  popupElement.innerHTML = `
    <div class="it-dictionary-header">
      <div class="it-dictionary-source">${text}</div>
    </div>
    <div class="it-dictionary-translation"><i>Translating...</i></div>
    <div class="it-dictionary-actions">
      <button class="it-dict-btn listen-btn">
        <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
        Listen
      </button>
      <button class="it-dict-btn save-btn">
        <svg viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z"/></svg>
        Save
      </button>
    </div>
  `;

  document.body.appendChild(popupElement);

  const transDiv = popupElement.querySelector('.it-dictionary-translation') as HTMLElement;
  const listenBtn = popupElement.querySelector('.listen-btn') as HTMLElement;
  const saveBtn = popupElement.querySelector('.save-btn') as HTMLElement;

  let currentTranslation = '';

  try {
    const response = await sendToBackground<TranslationResult>({
      type: 'TRANSLATE_REQUEST',
      payload: { texts: [text], sourceLang, targetLang, engine },
    });

    if (response && response.success && response.data.translatedTexts.length > 0) {
      currentTranslation = response.data.translatedTexts[0];
      transDiv.textContent = currentTranslation;
    } else {
      const errMsg = !response ? 'Translation failed' : (!response.success ? response.error : 'Translation failed');
      transDiv.innerHTML = `<i style="color:red">${errMsg}</i>`;
    }
  } catch (err) {
    transDiv.innerHTML = '<i style="color:red">Error connecting to service</i>';
  }

  listenBtn.addEventListener('click', () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (sourceLang !== 'auto') utterance.lang = sourceLang;
      window.speechSynthesis.speak(utterance);
    }
  });

  saveBtn.addEventListener('click', async () => {
    if (!currentTranslation) return;
    saveBtn.innerHTML = '<i>Saving...</i>';
    try {
      await saveVocabEntry({
        text,
        translation: currentTranslation,
        sourceLang,
        targetLang,
        sourceUrl: window.location.href,
        context: text // For a single word, the context is just the word for now
      });
      saveBtn.classList.add('saved');
      saveBtn.innerHTML = `
        <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
        Saved
      `;
    } catch (e) {
      saveBtn.textContent = 'Error';
    }
  });
}

function closePopup() {
  if (popupElement) {
    popupElement.remove();
    popupElement = null;
  }
}
