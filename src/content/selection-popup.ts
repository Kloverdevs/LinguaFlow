import { getSettings, onSettingsChanged } from '@/shared/storage';
import { sendToBackground } from '@/shared/message-bus';
import { TranslationResult } from '@/types/translation';
import { UserSettings } from '@/types/settings';
import { saveVocabEntry } from '@/shared/vocab-store';
import { getActiveSiteRule } from '@/shared/site-rulesHelper';
import { TARGET_LANGUAGES } from '@/constants/languages';
import { setTrustedHTML, clearElement, createStatusSpan } from './safe-dom';

/** Delay before resetting copy button text after successful/failed copy */
const COPY_FEEDBACK_MS = 2000;
/** Delay before attaching outside-click close handler (prevents instant close) */
const CLOSE_HANDLER_DELAY_MS = 100;

let popupElement: HTMLElement | null = null;
let currentSettings: UserSettings | null = null;
let activeDragCleanup: (() => void) | null = null;
let activeCloseHandler: ((e: MouseEvent) => void) | null = null;
let closeHandlerTimer: ReturnType<typeof setTimeout> | null = null;
let activeEscapeHandler: ((e: KeyboardEvent) => void) | null = null;
let previousFocus: HTMLElement | null = null;

// Keep settings in sync so popup always uses the latest target language
onSettingsChanged((newSettings) => {
  currentSettings = newSettings;
});

export async function showSelectionPopup(text: string, x: number, y: number) {
  closeSelectionPopup();
  previousFocus = document.activeElement as HTMLElement;

  if (!currentSettings) {
    currentSettings = await getSettings();
  }

  const activeRule = getActiveSiteRule(currentSettings);
  const targetLang = activeRule?.targetLang || currentSettings.targetLang;
  const engine = activeRule?.engine;

  popupElement = document.createElement('div');
  popupElement.className = 'it-selection-card';
  popupElement.setAttribute('role', 'dialog');
  popupElement.setAttribute('aria-modal', 'true');
  popupElement.setAttribute('aria-label', 'Translation popup');
  popupElement.setAttribute('tabindex', '-1');

  // Clamping to visible viewport
  const maxX = window.innerWidth - 350;
  const maxY = window.innerHeight - 200;
  popupElement.style.left = `${Math.min(x, maxX)}px`;
  popupElement.style.top = `${Math.min(y + 15, maxY)}px`;

  // Build popup using safe DOM APIs to avoid innerHTML (Firefox linter)
  const header = document.createElement('div');
  header.className = 'it-selection-header';
  const langPills = document.createElement('div');
  langPills.className = 'it-lang-pills';
  const sourcePill = document.createElement('span');
  sourcePill.className = 'it-lang-pill';
  sourcePill.textContent = currentSettings.sourceLang.toUpperCase();
  const arrow = document.createElement('span');
  arrow.textContent = '\u2192';
  const langSelect = document.createElement('select');
  langSelect.className = 'it-lang-pill it-lang-select';
  Object.assign(langSelect.style, { background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: '#ddd', padding: '2px 6px', borderRadius: '4px', fontWeight: '500', fontFamily: 'inherit', cursor: 'pointer', outline: 'none', WebkitAppearance: 'none', appearance: 'none', paddingRight: '20px' });
  TARGET_LANGUAGES.forEach(l => {
    const opt = document.createElement('option');
    opt.value = l.code;
    opt.textContent = l.name;
    Object.assign(opt.style, { background: '#1e293b', color: '#f8fafc' });
    if (l.code === targetLang) opt.selected = true;
    langSelect.appendChild(opt);
  });
  const dropArrow = document.createElement('span');
  Object.assign(dropArrow.style, { position: 'absolute', right: '10px', pointerEvents: 'none', fontSize: '10px', color: '#aaa' });
  dropArrow.textContent = '\u25BC';
  langPills.appendChild(sourcePill);
  langPills.appendChild(arrow);
  langPills.appendChild(langSelect);
  langPills.appendChild(dropArrow);
  header.appendChild(langPills);

  const contentArea = document.createElement('div');
  contentArea.className = 'it-selection-content';
  const primaryDiv = document.createElement('div');
  primaryDiv.className = 'it-translation-primary';
  primaryDiv.setAttribute('aria-live', 'polite');
  primaryDiv.appendChild(createStatusSpan('Translating...'));
  const compareDivEl = document.createElement('div');
  compareDivEl.className = 'it-translation-compare';
  Object.assign(compareDivEl.style, { display: 'none', borderTop: '1px dashed rgba(255,255,255,0.2)', paddingTop: '8px', marginTop: '8px' });
  const compareHeaderEl = document.createElement('div');
  compareHeaderEl.className = 'it-compare-header';
  Object.assign(compareHeaderEl.style, { fontSize: '0.75rem', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' });
  const compareTextEl = document.createElement('div');
  compareTextEl.className = 'it-compare-text';
  Object.assign(compareTextEl.style, { fontSize: '1rem', color: '#ddd' });
  compareDivEl.appendChild(compareHeaderEl);
  compareDivEl.appendChild(compareTextEl);
  const explainDivEl = document.createElement('div');
  explainDivEl.className = 'it-translation-explain';
  Object.assign(explainDivEl.style, { display: 'none', borderTop: '1px dashed rgba(255,255,255,0.2)', paddingTop: '8px', marginTop: '8px' });
  const explainLabel = document.createElement('div');
  Object.assign(explainLabel.style, { fontSize: '0.75rem', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' });
  explainLabel.textContent = 'Grammar & Vocabulary';
  const explainTextEl = document.createElement('div');
  explainTextEl.className = 'it-explain-text';
  Object.assign(explainTextEl.style, { fontSize: '0.95rem', color: '#ddd', lineHeight: '1.4' });
  explainDivEl.appendChild(explainLabel);
  explainDivEl.appendChild(explainTextEl);
  contentArea.appendChild(primaryDiv);
  contentArea.appendChild(compareDivEl);
  contentArea.appendChild(explainDivEl);

  const actionsSvgs: Record<string, string> = {
    copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>',
    compare: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h5v2h2V1h-2v2zm0 15H5l5-6v6zm9-15h-5v2h5v14h-5v2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>',
    explain: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 5.6L5 7l1.4-2.5L5 2l2.5 1.4L10 2 8.6 4.5 10 7 7.5 5.6zm12 9.8L17 14l1.4 2.5L17 19l2.5-1.4L22 19l-1.4-2.5L22 14l-2.5 1.4zM22 2l-2.5 1.4L17 2l1.4 2.5L17 7l2.5-1.4L22 7l-1.4-2.5L22 2zm-7.63 5.29c-.39-.39-1.02-.39-1.41 0L1.29 18.96c-.39.39-.39 1.02 0 1.41l2.34 2.34c.39.39 1.02.39 1.41 0L16.71 11.04c.39-.39.39-1.02 0-1.41l-2.34-2.34z"/></svg>',
    listen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>',
    fup: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2zM21 12l-3 7H9V9l4.34-4.34L12 10h9v2z"/></svg>',
    fdown: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm0 12l-4.34 4.34L12 14H3v-2l3-7h9v10zm4-12h4v12h-4z"/></svg>',
    save: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z"/></svg>',
  };

  function createActionBtn(cls: string, title: string, svgKey: string, label?: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = `it-sel-btn ${cls}`;
    btn.title = title;
    btn.setAttribute('aria-label', title);
    setTrustedHTML(btn, actionsSvgs[svgKey] + (label ? `\n        ${label}` : ''));
    return btn;
  }

  const actionsEl = document.createElement('div');
  actionsEl.className = 'it-selection-actions';
  actionsEl.style.display = 'none';
  const copyBtnEl = createActionBtn('copy-btn', 'Copy translation', 'copy', 'Copy');
  const compareBtnEl = createActionBtn('compare-btn', 'Compare Engines', 'compare', 'Compare');
  compareBtnEl.style.display = 'none';
  const explainBtnEl = createActionBtn('explain-btn', 'Grammar Explain', 'explain');
  const listenBtnEl = createActionBtn('listen-btn', 'Listen', 'listen');
  const fupBtnEl = createActionBtn('fup-btn', 'Good Translation', 'fup');
  const fdownBtnEl = createActionBtn('fdown-btn', 'Poor Translation', 'fdown');
  const saveBtnEl = createActionBtn('save-btn', 'Save to Vocabulary', 'save', 'Save');
  actionsEl.appendChild(copyBtnEl);
  actionsEl.appendChild(compareBtnEl);
  actionsEl.appendChild(explainBtnEl);
  actionsEl.appendChild(listenBtnEl);
  actionsEl.appendChild(fupBtnEl);
  actionsEl.appendChild(fdownBtnEl);
  actionsEl.appendChild(saveBtnEl);

  popupElement.appendChild(header);
  popupElement.appendChild(contentArea);
  popupElement.appendChild(actionsEl);

  document.body.appendChild(popupElement);
  popupElement.focus();

  const contentDiv = primaryDiv;
  const compareDiv = compareDivEl;
  const compareHeader = compareHeaderEl;
  const compareText = compareTextEl;

  const explainDiv = explainDivEl;
  const explainText = explainTextEl;

  const actionsDiv = actionsEl;
  const copyBtn = copyBtnEl;
  const compareBtn = compareBtnEl;
  const explainBtn = explainBtnEl;
  const listenBtn = listenBtnEl;
  const fupBtn = fupBtnEl;
  const fdownBtn = fdownBtnEl;
  const saveBtn = saveBtnEl;

  if (header) {
    header.style.cursor = 'grab';
    
    header.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if ((e.target as Element).tagName === 'SELECT' || (e.target as Element).tagName === 'OPTION') return;
      
      const startX = e.clientX;
      const startY = e.clientY;
      const rect = popupElement!.getBoundingClientRect();
      const initialLeft = rect.left;
      const initialTop = rect.top;

      header.style.cursor = 'grabbing';
      e.preventDefault();

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!popupElement) return;
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        const newLeft = Math.max(0, Math.min(window.innerWidth - rect.width, initialLeft + dx));
        const newTop = Math.max(0, Math.min(window.innerHeight - rect.height, initialTop + dy));
        popupElement.style.left = `${newLeft}px`;
        popupElement.style.top = `${newTop}px`;
        popupElement.style.bottom = 'auto';
        popupElement.style.right = 'auto';
      };

      const onMouseUp = () => {
        if (header) header.style.cursor = 'grab';
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        activeDragCleanup = null;
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      activeDragCleanup = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };
    });
  }

  let currentTranslation = '';

  let currentTargetConfig = targetLang;
  
  const performTranslation = async (activeTargetLang: string) => {
    clearElement(contentDiv);
    contentDiv.appendChild(createStatusSpan('Translating...'));
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
        // Focus first action button for keyboard accessibility
        copyBtn.focus();

        if (currentSettings.compareEngine && currentSettings.compareEngine !== engine) {
          compareBtn.style.display = 'flex';
        }
      } else {
        const errMsg = !response ? 'Translation failed' : (!response.success ? response.error : 'Translation failed');
        clearElement(contentDiv);
        const span = document.createElement('span');
        span.className = 'it-selection-error';
        span.textContent = errMsg || 'Unknown error';
        contentDiv.appendChild(span);
      }
    } catch (err) {
      clearElement(contentDiv);
      const span = document.createElement('span');
      span.className = 'it-selection-error';
      span.textContent = (err as Error).message;
      contentDiv.appendChild(span);
    }
  };

  await performTranslation(targetLang);

  // Bind language switcher
  const targetLangSelect = langSelect;
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
    clearElement(compareText);
    compareText.appendChild(createStatusSpan('Translating...'));

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
        clearElement(compareText);
        const span = document.createElement('span');
        span.className = 'it-selection-error';
        span.textContent = errMsg || 'Unknown error';
        compareText.appendChild(span);
      }
    } catch (err) {
      clearElement(compareText);
      const span = document.createElement('span');
      span.className = 'it-selection-error';
      span.textContent = (err as Error).message;
      compareText.appendChild(span);
    }
    compareBtn.style.display = 'none'; // Hide compare button after clicked
  });

  explainBtn.addEventListener('click', async () => {
    explainBtn.disabled = true;
    explainBtn.style.opacity = '0.5';
    explainDiv.style.display = 'block';
    clearElement(explainText);
    explainText.appendChild(createStatusSpan('Analyzing grammar...'));

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
        clearElement(explainText);
        const lines = resp.data.split('\n');
        lines.forEach((line: string, i: number) => {
          if (line.trim() === '' && i === 0) return; 
          if (line.trim() === '' && i === lines.length -1) return;
          if (i > 0) explainText.appendChild(document.createElement('br'));
          const parts = line.split(/(\*\*.*?\*\*)/g);
          parts.forEach(part => {
            if (part.startsWith('**') && part.endsWith('**')) {
              const strong = document.createElement('strong');
              strong.textContent = part.slice(2, -2);
              explainText.appendChild(strong);
            } else {
              explainText.appendChild(document.createTextNode(part));
            }
          });
        });
      } else {
        const errMsg = !resp ? 'Failed' : (!resp.success ? resp.error : 'No explanation returned');
        clearElement(explainText);
        const span = document.createElement('span');
        span.className = 'it-selection-error';
        span.textContent = errMsg || 'Unknown error';
        explainText.appendChild(span);
      }
    } catch (err) {
      clearElement(explainText);
      const span = document.createElement('span');
      span.className = 'it-selection-error';
      span.textContent = (err as Error).message;
      explainText.appendChild(span);
    }
  });

  // Bind Actions
  copyBtn.addEventListener('click', async () => {
    if (!currentTranslation) return;
    try {
      await navigator.clipboard.writeText(currentTranslation);
      copyBtn.textContent = 'Copied';
      setTimeout(() => { copyBtn.textContent = 'Copy'; }, COPY_FEEDBACK_MS);
    } catch {
      copyBtn.textContent = 'Failed';
      setTimeout(() => { copyBtn.textContent = 'Copy'; }, COPY_FEEDBACK_MS);
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
    saveBtn.textContent = '...';
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
      setTrustedHTML(saveBtn, '<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>\n        Saved');
    } catch (e) {
      saveBtn.textContent = 'Error';
    }
  });

  // Close on outside click or Escape
  activeCloseHandler = (e: MouseEvent) => {
    if (popupElement && !popupElement.contains(e.target as Node)) {
      closeSelectionPopup();
    }
  };
  closeHandlerTimer = setTimeout(() => {
    if (activeCloseHandler) document.addEventListener('mousedown', activeCloseHandler);
    closeHandlerTimer = null;
  }, CLOSE_HANDLER_DELAY_MS);

  activeEscapeHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { closeSelectionPopup(); }
  };
  document.addEventListener('keydown', activeEscapeHandler);
}

export function closeSelectionPopup() {
  activeDragCleanup?.();
  activeDragCleanup = null;
  if (closeHandlerTimer) { clearTimeout(closeHandlerTimer); closeHandlerTimer = null; }
  if (activeCloseHandler) { document.removeEventListener('mousedown', activeCloseHandler); activeCloseHandler = null; }
  if (activeEscapeHandler) { document.removeEventListener('keydown', activeEscapeHandler); activeEscapeHandler = null; }
  if (popupElement) {
    popupElement.remove();
    popupElement = null;
  }
  previousFocus?.focus();
  previousFocus = null;
}
