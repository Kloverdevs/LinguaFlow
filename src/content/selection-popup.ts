import { getSettings, onSettingsChanged } from '@/shared/storage';
import { sendToBackground } from '@/shared/message-bus';
import { TranslationResult } from '@/types/translation';
import { saveVocabEntry } from '@/shared/vocab-store';
import { getActiveSiteRule } from '@/shared/site-rulesHelper';
import { TARGET_LANGUAGES } from '@/constants/languages';

let popupElement: HTMLElement | null = null;
let currentSettings: any = null;

// Keep settings in sync so popup always uses the latest target language
onSettingsChanged((newSettings) => {
  currentSettings = newSettings;
});

export async function showSelectionPopup(text: string, x: number, y: number) {
  closeSelectionPopup();

  if (!currentSettings) {
    currentSettings = await getSettings();
  }

  const activeRule = getActiveSiteRule(currentSettings);
  const targetLang = activeRule?.targetLang || currentSettings.targetLang;
  const engine = activeRule?.engine;

  popupElement = document.createElement('div');
  popupElement.className = 'it-selection-card';
  
  // Clamping to visible viewport
  const maxX = window.innerWidth - 350;
  const maxY = window.innerHeight - 200;
  popupElement.style.left = `${Math.min(x, maxX)}px`;
  popupElement.style.top = `${Math.min(y + 15, maxY)}px`;

  const langOptions = TARGET_LANGUAGES.map(l => 
    `<option value="${l.code}" style="background: #1e293b; color: #f8fafc;" ${l.code === targetLang ? 'selected' : ''}>${l.name}</option>`
  ).join('');

  popupElement.innerHTML = `
    <div class="it-selection-header">
      <div class="it-lang-pills">
        <span class="it-lang-pill">${currentSettings.sourceLang.toUpperCase()}</span>
        <span>→</span>
        <select class="it-lang-pill it-lang-select" style="background: rgba(255, 255, 255, 0.1); border: none; color: #ddd; padding: 2px 6px; border-radius: 4px; font-weight: 500; font-family: inherit; cursor: pointer; outline: none; -webkit-appearance: none; appearance: none; padding-right: 20px;">
          ${langOptions}
        </select>
        <span style="position: absolute; right: 10px; pointer-events: none; font-size: 10px; color: #aaa;">▼</span>
      </div>
    </div>
    <div class="it-selection-content">
      <div class="it-translation-primary"><span style="opacity:0.7">Translating...</span></div>
      <div class="it-translation-compare" style="display:none; border-top: 1px dashed rgba(255,255,255,0.2); padding-top: 8px; margin-top: 8px;">
        <div class="it-compare-header" style="font-size: 0.75rem; color: #999; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;"></div>
        <div class="it-compare-text" style="font-size: 1rem; color: #ddd;"></div>
      </div>
      <div class="it-translation-explain" style="display:none; border-top: 1px dashed rgba(255,255,255,0.2); padding-top: 8px; margin-top: 8px;">
        <div style="font-size: 0.75rem; color: #999; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Grammar & Vocabulary</div>
        <div class="it-explain-text" style="font-size: 0.95rem; color: #ddd; line-height: 1.4;"></div>
      </div>
    </div>
    <div class="it-selection-actions" style="display:none">
      <button class="it-sel-btn copy-btn" title="Copy translation">
        <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
        Copy
      </button>
      <button class="it-sel-btn compare-btn" title="Compare Engines" style="display:none">
        <svg viewBox="0 0 24 24"><path d="M10 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h5v2h2V1h-2v2zm0 15H5l5-6v6zm9-15h-5v2h5v14h-5v2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>
        Compare
      </button>
      <button class="it-sel-btn explain-btn" title="Grammar Explain">
        <svg viewBox="0 0 24 24"><path d="M7.5 5.6L5 7l1.4-2.5L5 2l2.5 1.4L10 2 8.6 4.5 10 7 7.5 5.6zm12 9.8L17 14l1.4 2.5L17 19l2.5-1.4L22 19l-1.4-2.5L22 14l-2.5 1.4zM22 2l-2.5 1.4L17 2l1.4 2.5L17 7l2.5-1.4L22 7l-1.4-2.5L22 2zm-7.63 5.29c-.39-.39-1.02-.39-1.41 0L1.29 18.96c-.39.39-.39 1.02 0 1.41l2.34 2.34c.39.39 1.02.39 1.41 0L16.71 11.04c.39-.39.39-1.02 0-1.41l-2.34-2.34z"/></svg>
      </button>
      <button class="it-sel-btn listen-btn" title="Listen">
        <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
      </button>
      <button class="it-sel-btn fup-btn" title="Good Translation">
        <svg viewBox="0 0 24 24"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2zM21 12l-3 7H9V9l4.34-4.34L12 10h9v2z"/></svg>
      </button>
      <button class="it-sel-btn fdown-btn" title="Poor Translation">
        <svg viewBox="0 0 24 24"><path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm0 12l-4.34 4.34L12 14H3v-2l3-7h9v10zm4-12h4v12h-4z"/></svg>
      </button>
      <button class="it-sel-btn save-btn" title="Save to Vocabulary">
        <svg viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z"/></svg>
        Save
      </button>
    </div>
  `;

  document.body.appendChild(popupElement);

  const contentDiv = popupElement.querySelector('.it-translation-primary') as HTMLElement;
  const compareDiv = popupElement.querySelector('.it-translation-compare') as HTMLElement;
  const compareHeader = popupElement.querySelector('.it-compare-header') as HTMLElement;
  const compareText = popupElement.querySelector('.it-compare-text') as HTMLElement;
  
  const explainDiv = popupElement.querySelector('.it-translation-explain') as HTMLElement;
  const explainText = popupElement.querySelector('.it-explain-text') as HTMLElement;
  
  const actionsDiv = popupElement.querySelector('.it-selection-actions') as HTMLElement;
  const copyBtn = popupElement.querySelector('.copy-btn') as HTMLButtonElement;
  const compareBtn = popupElement.querySelector('.compare-btn') as HTMLButtonElement;
  const explainBtn = popupElement.querySelector('.explain-btn') as HTMLButtonElement;
  const listenBtn = popupElement.querySelector('.listen-btn') as HTMLButtonElement;
  const fupBtn = popupElement.querySelector('.fup-btn') as HTMLButtonElement;
  const fdownBtn = popupElement.querySelector('.fdown-btn') as HTMLButtonElement;
  const saveBtn = popupElement.querySelector('.save-btn') as HTMLButtonElement;

  let currentTranslation = '';

  let currentTargetConfig = targetLang;
  
  const performTranslation = async (activeTargetLang: string) => {
    contentDiv.innerHTML = '<span style="opacity:0.7">Translating...</span>';
    actionsDiv.style.display = 'none';
    explainDiv.style.display = 'none';
    compareDiv.style.display = 'none';
    explainBtn.disabled = false;
    explainBtn.style.opacity = '1';
    
    try {
      const response = await sendToBackground<TranslationResult>({
        type: 'TRANSLATE_REQUEST',
        payload: { 
          texts: [text], 
          sourceLang: currentSettings.sourceLang, 
          targetLang: activeTargetLang,
          engine: engine
        },
      });

      if (response && response.success && response.data.translatedTexts.length > 0) {
        currentTranslation = response.data.translatedTexts[0];
        contentDiv.textContent = currentTranslation;
        actionsDiv.style.display = 'flex';
        
        if (currentSettings.compareEngine && currentSettings.compareEngine !== engine) {
          compareBtn.style.display = 'flex';
        }
      } else {
        const errMsg = !response ? 'Translation failed' : (!response.success ? response.error : 'Translation failed');
        contentDiv.innerHTML = `<span class="it-selection-error">${errMsg}</span>`;
      }
    } catch (err) {
      contentDiv.innerHTML = `<span class="it-selection-error">${(err as Error).message}</span>`;
    }
  };

  await performTranslation(targetLang);

  // Bind language switcher
  const targetLangSelect = popupElement.querySelector('.it-lang-select') as HTMLSelectElement;
  targetLangSelect.addEventListener('change', () => {
    currentTargetConfig = targetLangSelect.value;
    performTranslation(currentTargetConfig);
  });

  compareBtn.addEventListener('click', async () => {
    if (!currentSettings.compareEngine) return;
    compareBtn.disabled = true;
    compareBtn.style.opacity = '0.5';
    compareDiv.style.display = 'block';
    compareHeader.textContent = `Comparing with ${currentSettings.compareEngine}...`;
    compareText.innerHTML = '<span style="opacity:0.7">Translating...</span>';

    try {
      const resp = await sendToBackground<TranslationResult>({
        type: 'TRANSLATE_REQUEST',
        payload: { 
          texts: [text], 
          sourceLang: currentSettings.sourceLang, 
          targetLang: currentTargetConfig,
          engine: currentSettings.compareEngine
        },
      });

      if (resp && resp.success && resp.data.translatedTexts.length > 0) {
        compareHeader.textContent = resp.data.engine;
        compareText.textContent = resp.data.translatedTexts[0];
      } else {
        const errMsg = !resp ? 'Failed' : (!resp.success ? resp.error : 'No translation returned');
        compareText.innerHTML = `<span class="it-selection-error">${errMsg}</span>`;
      }
    } catch (err) {
      compareText.innerHTML = `<span class="it-selection-error">${(err as Error).message}</span>`;
    }
    compareBtn.style.display = 'none'; // Hide compare button after clicked
  });

  explainBtn.addEventListener('click', async () => {
    explainBtn.disabled = true;
    explainBtn.style.opacity = '0.5';
    explainDiv.style.display = 'block';
    explainText.innerHTML = '<span style="opacity:0.7">Analyzing grammar...</span>';

    try {
      const resp = await sendToBackground<string>({
        type: 'EXPLAIN_GRAMMAR_REQUEST',
        payload: { 
          text, 
          sourceLang: currentSettings.sourceLang, 
          targetLang: currentTargetConfig
        },
      });

      if (resp && resp.success) {
        // Very basic markdown formatting for the explanation
        const html = resp.data
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\n /g, '<br/>')
          .replace(/\n/g, '<br/>');
        explainText.innerHTML = html;
      } else {
        const errMsg = !resp ? 'Failed' : (!resp.success ? resp.error : 'No explanation returned');
        explainText.innerHTML = `<span class="it-selection-error">${errMsg}</span>`;
      }
    } catch (err) {
      explainText.innerHTML = `<span class="it-selection-error">${(err as Error).message}</span>`;
    }
  });

  // Bind Actions
  copyBtn.addEventListener('click', () => {
    if (currentTranslation) {
      navigator.clipboard.writeText(currentTranslation);
      const originalHtml = copyBtn.innerHTML;
      copyBtn.innerHTML = `
        <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
        Copied
      `;
      setTimeout(() => copyBtn.innerHTML = originalHtml, 2000);
    }
  });

  listenBtn.addEventListener('click', () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (currentSettings.sourceLang !== 'auto') utterance.lang = currentSettings.sourceLang;
      window.speechSynthesis.speak(utterance);
    }
  });

  fupBtn.addEventListener('click', () => {
    fupBtn.style.color = '#10b981';
    fdownBtn.style.color = '';
  });

  fdownBtn.addEventListener('click', () => {
    fdownBtn.style.color = '#ef4444';
    fupBtn.style.color = '';
  });

  saveBtn.addEventListener('click', async () => {
    if (!currentTranslation) return;
    saveBtn.innerHTML = '...';
    try {
      await saveVocabEntry({
        text,
        translation: currentTranslation,
        sourceLang: currentSettings.sourceLang,
        targetLang: currentTargetConfig,
        sourceUrl: window.location.href,
        context: text
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

  // Close on outside click
  const closeHandler = (e: MouseEvent) => {
    if (popupElement && !popupElement.contains(e.target as Node)) {
      closeSelectionPopup();
      document.removeEventListener('mousedown', closeHandler);
    }
  };
  setTimeout(() => document.addEventListener('mousedown', closeHandler), 100);
}

export function closeSelectionPopup() {
  if (popupElement) {
    popupElement.remove();
    popupElement = null;
  }
}
