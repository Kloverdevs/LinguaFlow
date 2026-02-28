import { DisplayMode } from '@/types/settings';

let currentMode: DisplayMode = 'replace';

export function setDisplayMode(mode: DisplayMode): void {
  currentMode = mode;
}

export function getDisplayMode(): DisplayMode {
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

// ─── Loading ────────────────────────────────────────────────────────

export function showLoading(originalEl: HTMLElement): HTMLElement {
  // Store original for restore (both modes need this)
  if (!originalEl.hasAttribute('data-immersive-original-html')) {
    originalEl.setAttribute('data-immersive-original-html', originalEl.innerHTML);
    originalEl.setAttribute('data-immersive-original-lang', originalEl.getAttribute('lang') || '');
  }
  originalEl.setAttribute('data-immersive-translated', 'true');

  if (currentMode === 'replace') {
    originalEl.classList.add('immersive-translate-loading');
    return originalEl;
  }

  // Bilingual mode: insert a block after the element
  // Use <span> for inline elements to avoid breaking flow
  const isInline = isInlineElement(originalEl);
  const block = document.createElement(isInline ? 'span' : 'div');
  block.className = 'it-bilingual-block it-loading';
  if (isInline) block.classList.add('it-inline-block');
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
  if (currentMode === 'replace') {
    loader.classList.remove('immersive-translate-loading');
    loader.setAttribute('lang', targetLang);

    // If element has interactive children (links, buttons), preserve them
    if (hasInteractiveChildren(loader)) {
      replaceTextNodes(loader, translatedText);
    } else {
      loader.textContent = translatedText;
    }
  } else {
    // Bilingual: the loader is the block we inserted
    loader.classList.remove('it-loading');
    loader.setAttribute('lang', targetLang);
    loader.textContent = translatedText;
  }
}

// ─── Error ──────────────────────────────────────────────────────────

export function showError(loader: HTMLElement, error: string): void {
  if (currentMode === 'replace') {
    loader.classList.remove('immersive-translate-loading');
    const originalHTML = loader.getAttribute('data-immersive-original-html');
    if (originalHTML !== null) {
      loader.innerHTML = originalHTML;
    }
    loader.removeAttribute('data-immersive-translated');
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
  // Remove bilingual blocks
  document.querySelectorAll('[data-immersive-block]').forEach((el) => el.remove());

  // Restore replaced elements
  document.querySelectorAll('[data-immersive-translated]').forEach((el) => {
    const htmlEl = el as HTMLElement;
    const originalHTML = htmlEl.getAttribute('data-immersive-original-html');
    const originalLang = htmlEl.getAttribute('data-immersive-original-lang');

    if (originalHTML !== null) {
      htmlEl.innerHTML = originalHTML;
    }
    if (originalLang) {
      htmlEl.setAttribute('lang', originalLang);
    } else {
      htmlEl.removeAttribute('lang');
    }

    htmlEl.removeAttribute('data-immersive-translated');
    htmlEl.removeAttribute('data-immersive-original-html');
    htmlEl.removeAttribute('data-immersive-original-lang');
    htmlEl.removeAttribute('data-immersive-hover');
    htmlEl.classList.remove('immersive-translate-loading');
    htmlEl.classList.remove('it-hover-highlight');
  });
}
