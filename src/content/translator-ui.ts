import { DisplayMode } from '@/types/settings';
import { isPdfPage } from './pdf-handler';

let currentMode: DisplayMode = 'replace';
let ttsEnabled = true;
let dyslexiaFontEnabled = false;

export function setDisplayMode(mode: DisplayMode): void {
  currentMode = mode;
}

export function setDyslexiaFont(enabled: boolean): void {
  dyslexiaFontEnabled = enabled;
}

export function getDisplayMode(): DisplayMode {
  return currentMode;
}

function getEffectiveMode(el: HTMLElement): DisplayMode {
  if (isPdfPage()) return 'replace';
  // Native PDF.js viewers (like Firefox or PDFObject) use absolute positioned .textLayer spans. 
  // Bilingual blocks (injected div adjacent siblings) break their coordinates, so force replace mode.
  if (el.closest('.textLayer') || el.classList.contains('textLayer')) return 'replace';
  return currentMode;
}

/** Inline-level tags where bilingual block should use <span> not <div> */
const INLINE_TAGS = new Set([
  'A', 'SPAN', 'LABEL', 'EM', 'STRONG', 'B', 'I',
  'SMALL', 'MARK', 'TIME', 'CITE', 'Q', 'ABBR',
  'S', 'U', 'DEL', 'INS', 'SUB', 'SUP', 'DATA', 'OUTPUT',
]);

function isInlineElement(el: HTMLElement): boolean {
  return INLINE_TAGS.has(el.tagName);
}

/** Tags that contain interactive children which shouldn't be wiped out */
const INTERACTIVE_CHILDREN = new Set(['A', 'BUTTON', 'INPUT', 'SELECT', 'DETAILS', 'SUMMARY']);

/** Check if element has interactive child elements that would break if we use textContent */
function hasInteractiveChildren(el: HTMLElement): boolean {
  for (const child of el.querySelectorAll('*')) {
    if (INTERACTIVE_CHILDREN.has(child.tagName)) return true;
  }
  return false;
}

/**
 * Replace only the direct text nodes within an element, preserving child element structure.
 * Used for replace mode on elements with interactive children.
 */
function replaceTextNodes(el: HTMLElement, text: string): void {
  const textNodes: Text[] = [];
  for (const child of el.childNodes) {
    if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
      textNodes.push(child as Text);
    }
  }

  if (textNodes.length === 0) {
    // Fallback: no direct text nodes, just set textContent on the element itself
    el.textContent = text;
    return;
  }

  // Put all translated text into the first text node, clear the rest
  textNodes[0].textContent = text;
  for (let i = 1; i < textNodes.length; i++) {
    textNodes[i].textContent = '';
  }
}

// ─── TTS ────────────────────────────────────────────────────────────

export function setTtsEnabled(enabled: boolean): void {
  ttsEnabled = enabled;
}

function speakText(text: string, lang: string): void {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  }
}

function createTtsButton(text: string, lang: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = 'it-tts-btn';
  btn.title = 'Listen';
  btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07"/><path d="M19.07 4.93a10 10 0 010 14.14"/></svg>';
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    speakText(text, lang);
  });
  return btn;
}

function createFeedbackButton(isUp: boolean): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = `it-tts-btn it-feedback-${isUp ? 'up' : 'down'}`;
  btn.title = isUp ? 'Good translation' : 'Poor translation';
  btn.innerHTML = isUp 
    ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2zM21 12l-3 7H9V9l4.34-4.34L12 10h9v2z"/></svg>'
    : '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm0 12l-4.34 4.34L12 14H3v-2l3-7h9v10zm4-12h4v12h-4z"/></svg>';
  
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const active = btn.parentElement?.querySelector('.it-feedback-active');
    if (active) active.classList.remove('it-feedback-active');
    btn.classList.add('it-feedback-active');
  });
  return btn;
}

// ─── Show-original tooltip for replace mode ─────────────────────────

function addHoverOriginalTooltip(el: HTMLElement): void {
  const originalText = el.getAttribute('data-immersive-original-text');
  if (!originalText) return;

  let tooltip: HTMLElement | null = null;

  const show = () => {
    if (tooltip) return;
    tooltip = document.createElement('div');
    tooltip.className = 'it-original-tooltip';
    tooltip.textContent = originalText;
    const rect = el.getBoundingClientRect();
    tooltip.style.left = `${rect.left + window.scrollX}px`;
    tooltip.style.top = `${rect.top + window.scrollY - 4}px`;
    document.body.appendChild(tooltip);
  };

  const hide = () => {
    tooltip?.remove();
    tooltip = null;
  };

  el.addEventListener('mouseenter', show);
  el.addEventListener('mouseleave', hide);
}

// ─── Loading ────────────────────────────────────────────────────────

export function showLoading(originalEl: HTMLElement): HTMLElement {
  // Store original for restore (both modes need this)
  if (!originalEl.hasAttribute('data-immersive-original-html')) {
    originalEl.setAttribute('data-immersive-original-html', originalEl.innerHTML);
    originalEl.setAttribute('data-immersive-original-lang', originalEl.getAttribute('lang') || '');
  }
  originalEl.setAttribute('data-immersive-translated', 'true');

  const effectiveMode = getEffectiveMode(originalEl);
  if (effectiveMode === 'replace') {
    originalEl.classList.add('immersive-translate-loading');
    if (dyslexiaFontEnabled) originalEl.classList.add('it-dyslexia-font');
    return originalEl;
  }

  // Bilingual mode: insert a block after the element
  // Use <span> for inline elements to avoid breaking flow
  const isInline = isInlineElement(originalEl);
  const block = document.createElement(isInline ? 'span' : 'div');
  block.className = 'it-bilingual-block it-loading';
  if (isInline) block.classList.add('it-inline-block');
  if (dyslexiaFontEnabled) block.classList.add('it-dyslexia-font');
  block.setAttribute('data-immersive-block', 'true');
  block.innerHTML = '<span class="it-loading-dots"><span></span><span></span><span></span></span>';
  originalEl.parentNode?.insertBefore(block, originalEl.nextSibling);
  return block;
}

// ─── Replace loading with translation ────────────────────────────

export function replaceLoading(
  loader: HTMLElement,
  translatedText: string,
  targetLang: string
): void {
  const effectiveMode = getEffectiveMode(loader);
  if (effectiveMode === 'replace') {
    loader.classList.remove('immersive-translate-loading');
    loader.classList.add('it-replace-enter');
    loader.setAttribute('lang', targetLang);

    // Store original text for hover tooltip
    const originalText = loader.getAttribute('data-immersive-original-html');
    if (originalText) {
      // Safely parse the HTML without creating live executable elements
      try {
        const doc = new DOMParser().parseFromString(originalText, 'text/html');
        loader.setAttribute('data-immersive-original-text', doc.body.textContent ?? '');
      } catch (e) {
        loader.setAttribute('data-immersive-original-text', '');
      }
    }

    // If element has interactive children (links, buttons), preserve them
    if (hasInteractiveChildren(loader)) {
      replaceTextNodes(loader, translatedText);
    } else {
      loader.textContent = translatedText;
    }

    // Add show-original tooltip on hover (skip for PDFs to prevent overlapping blocks)
    if (!isPdfPage()) {
      addHoverOriginalTooltip(loader);
    }
  } else {
    // Bilingual: the loader is the block we inserted
    loader.classList.remove('it-loading');
    loader.classList.add('it-bilingual-enter');
    loader.setAttribute('lang', targetLang);
    loader.textContent = translatedText;

    // Add TTS button for bilingual blocks
    if (ttsEnabled) {
      loader.appendChild(createTtsButton(translatedText, targetLang));
    }
    loader.appendChild(createFeedbackButton(true));
    loader.appendChild(createFeedbackButton(false));
  }
}

// ─── Error ──────────────────────────────────────────────────────────

export function showError(loader: HTMLElement, error: string): void {
  const effectiveMode = getEffectiveMode(loader);
  if (effectiveMode === 'replace') {
    loader.classList.remove('immersive-translate-loading');
    // Mark as skip BEFORE DOM modification to prevent MutationObserver re-detection
    loader.setAttribute('data-immersive-skip', 'true');
    loader.removeAttribute('data-immersive-translated');
    const originalHTML = loader.getAttribute('data-immersive-original-html');
    if (originalHTML !== null) {
      const doc = new DOMParser().parseFromString(originalHTML, 'text/html');
      loader.textContent = '';
      for (const child of Array.from(doc.body.childNodes)) {
        loader.appendChild(child.cloneNode(true));
      }
    }
    loader.removeAttribute('data-immersive-original-html');
    loader.removeAttribute('data-immersive-original-lang');
    // Allow re-detection after DOM settles
    setTimeout(() => loader.removeAttribute('data-immersive-skip'), 1000);
  } else {
    loader.classList.remove('it-loading');
    if (error) {
      loader.classList.add('it-error');
      loader.textContent = 'Translation failed';
    } else {
      // Empty error = silent restore (same-language skip)
      loader.remove();
    }
  }
  if (error) {
    console.error('[LinguaFlow]', error);
  }
}

// ─── Remove all ────────────────────────────────────────────────────

export function removeAllTranslations(): void {
  // Cancel any ongoing TTS
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }

  // Remove original-text tooltips
  document.querySelectorAll('.it-original-tooltip').forEach((el) => el.remove());

  // Remove bilingual blocks
  document.querySelectorAll('[data-immersive-block]').forEach((el) => el.remove());

  // Restore replaced elements
  document.querySelectorAll('[data-immersive-translated]').forEach((el) => {
    const htmlEl = el as HTMLElement;
    const originalHTML = htmlEl.getAttribute('data-immersive-original-html');
    const originalLang = htmlEl.getAttribute('data-immersive-original-lang');

    if (originalHTML !== null) {
      const doc = new DOMParser().parseFromString(originalHTML, 'text/html');
      htmlEl.textContent = '';
      for (const child of Array.from(doc.body.childNodes)) {
        htmlEl.appendChild(child.cloneNode(true));
      }
    }
    if (originalLang) {
      htmlEl.setAttribute('lang', originalLang);
    } else {
      htmlEl.removeAttribute('lang');
    }

    htmlEl.removeAttribute('data-immersive-translated');
    htmlEl.removeAttribute('data-immersive-original-html');
    htmlEl.removeAttribute('data-immersive-original-lang');
    htmlEl.removeAttribute('data-immersive-original-text');
    htmlEl.removeAttribute('data-immersive-hover');
    htmlEl.classList.remove('immersive-translate-loading');
    htmlEl.classList.remove('it-hover-highlight');
    htmlEl.classList.remove('it-replace-enter');
    htmlEl.classList.remove('it-dyslexia-font');
  });
}
