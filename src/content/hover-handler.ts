import { sendToBackground } from '@/shared/message-bus';
import { TranslationResult } from '@/types/translation';
import { MessageResponse } from '@/types/messages';
import { isSubstantiveText } from './content-detector';
import { isPdfPage } from './pdf-handler';

const DEBOUNCE_MS = 300;

let hoverTimer: ReturnType<typeof setTimeout> | null = null;
let hoverEnabled = false;
let targetLang = 'en';
let activeHoverEl: HTMLElement | null = null;
let activeHoverBlock: HTMLElement | null = null;
let pendingAbort: AbortController | null = null;

export function enableHover(lang: string): void {
  hoverEnabled = true;
  targetLang = lang;
  document.addEventListener('mouseenter', handleMouseEnter, true);
  document.addEventListener('mouseleave', handleMouseLeave, true);
}

export function disableHover(): void {
  hoverEnabled = false;
  cancelPending();
  document.removeEventListener('mouseenter', handleMouseEnter, true);
  document.removeEventListener('mouseleave', handleMouseLeave, true);
}

export function updateHoverLang(lang: string): void {
  targetLang = lang;
}

/**
 * Tags that are directly hoverable for translation.
 * Matches the full set from dom-walker to avoid missing sections.
 */
const HOVER_TAGS = new Set([
  // Block-level translatable
  'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'LI', 'TD', 'TH', 'BLOCKQUOTE', 'FIGCAPTION',
  'DT', 'DD', 'SUMMARY', 'CAPTION', 'LEGEND', 'ADDRESS',
  // Inline translatable
  'A', 'SPAN', 'LABEL', 'EM', 'STRONG', 'B', 'I',
  'SMALL', 'MARK', 'TIME', 'CITE', 'Q', 'ABBR',
]);

/**
 * Container tags that we also support for hover, but only when they
 * contain text directly (no block children).
 */
const HOVER_CONTAINER_TAGS = new Set([
  'DIV', 'SECTION', 'ARTICLE', 'NAV', 'HEADER', 'FOOTER',
  'ASIDE', 'FIGURE', 'DETAILS', 'FORM',
]);

/** Block-level children that indicate a container is not a leaf text element */
const BLOCK_CHILDREN = new Set([
  'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'DIV', 'SECTION',
  'ARTICLE', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'TABLE', 'FIGURE',
  'NAV', 'HEADER', 'FOOTER', 'ASIDE', 'FORM', 'DETAILS',
  'ADDRESS', 'DL',
]);

function hasBlockChildren(el: HTMLElement): boolean {
  for (const child of el.children) {
    if (BLOCK_CHILDREN.has(child.tagName)) return true;
  }
  return false;
}

/** Check if any ancestor is already hover-translated */
function hasTranslatedAncestor(el: HTMLElement): boolean {
  let parent = el.parentElement;
  while (parent && parent !== document.body) {
    if (parent.hasAttribute('data-immersive-hover')) return true;
    parent = parent.parentElement;
  }
  return false;
}

/** Check if any descendant is already hover-translated */
function hasTranslatedDescendant(el: HTMLElement): boolean {
  return el.querySelector('[data-immersive-hover]') !== null;
}

/**
 * For inline elements, check if a block-level parent would cover the text.
 * This prevents hovering a <span> inside a <p> — hover the <p> instead.
 */
function hasHoverableBlockParent(el: HTMLElement): boolean {
  let parent = el.parentElement;
  while (parent && parent !== document.body) {
    if (HOVER_TAGS.has(parent.tagName) && !HOVER_CONTAINER_TAGS.has(parent.tagName)) {
      return true;
    }
    parent = parent.parentElement;
  }
  return false;
}

/**
 * Get the hoverable text from a container — only inline text content,
 * not text inside block children.
 */
function getInlineTextContent(el: HTMLElement): string {
  let text = '';
  for (const child of el.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      text += child.textContent || '';
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const childEl = child as HTMLElement;
      if (!BLOCK_CHILDREN.has(childEl.tagName)) {
        text += childEl.textContent || '';
      }
    }
  }
  return text.trim();
}

function cancelPending(): void {
  if (hoverTimer) {
    clearTimeout(hoverTimer);
    hoverTimer = null;
  }
  pendingAbort?.abort();
  pendingAbort = null;

  // Remove highlight from previous element
  if (activeHoverEl) {
    activeHoverEl.classList.remove('it-hover-highlight');
  }
  activeHoverEl = null;
}

/** Check if element is part of LinguaFlow's own UI (FAB, menu, onboarding, tooltip) */
function isLinguaFlowElement(el: HTMLElement): boolean {
  if (el.id?.startsWith('immersive-translate')) return true;
  if (el.closest?.('#immersive-translate-fab')) return true;
  if (el.closest?.('#immersive-translate-fab-menu')) return true;
  if (el.closest?.('#immersive-translate-onboarding')) return true;
  if (el.closest?.('.immersive-selection-tooltip')) return true;
  if (el.classList?.contains('it-bilingual-block')) return true;
  return false;
}

function handleMouseEnter(e: MouseEvent): void {
  if (!hoverEnabled || isPdfPage()) return;

  const el = e.target as HTMLElement;
  if (isLinguaFlowElement(el)) return;
  // Ignore PDF.js native text layer elements to prevent hover boxes from breaking absolute positioning
  if (el.closest('.textLayer') || el.classList.contains('textLayer')) return;
  if (el.hasAttribute('data-immersive-translated')) return;
  if (el.hasAttribute('data-immersive-block')) return;

  let textToTranslate: string | null = null;

  if (HOVER_TAGS.has(el.tagName)) {
    // For inline tags inside a block parent, skip — the block parent is better to hover
    if (HOVER_CONTAINER_TAGS.has(el.tagName)) {
      // This shouldn't match since HOVER_CONTAINER_TAGS is separate, but guard
      return;
    }

    // Skip inline elements that are inside a hoverable block parent
    const isInline = !BLOCK_CHILDREN.has(el.tagName);
    if (isInline && hasHoverableBlockParent(el)) return;

    // Skip elements that contain block children — they're containers, not leaf text
    if (hasBlockChildren(el)) return;

    textToTranslate = el.textContent?.trim() || null;
  } else if (HOVER_CONTAINER_TAGS.has(el.tagName)) {
    // Container tags: only hover if they have inline text and no block children
    if (hasBlockChildren(el)) return;
    textToTranslate = getInlineTextContent(el);
  } else {
    return;
  }

  if (!textToTranslate || !isSubstantiveText(textToTranslate)) return;

  // Skip if an ancestor or descendant is already hover-translated
  if (hasTranslatedAncestor(el)) return;
  if (hasTranslatedDescendant(el)) return;

  // Cancel any previous pending hover
  cancelPending();

  // Add subtle highlight immediately to show the element is targeted
  el.classList.add('it-hover-highlight');
  activeHoverEl = el;

  hoverTimer = setTimeout(async () => {
    const originalText = textToTranslate!;

    // Mark as translated
    el.setAttribute('data-immersive-translated', 'true');
    el.setAttribute('data-immersive-hover', 'true');
    el.classList.remove('it-hover-highlight');

    // Create bilingual block below — use <span> for inline elements to preserve flow
    const isInlineEl = getComputedStyle(el).display === 'inline';
    const block = document.createElement(isInlineEl ? 'span' : 'div');
    block.className = 'it-bilingual-block it-hover-block it-loading';
    if (isInlineEl) block.classList.add('it-inline-block');
    block.setAttribute('data-immersive-block', 'true');
    block.setAttribute('data-immersive-hover-block', 'true');
    block.innerHTML = '<span class="it-loading-dots"><span></span><span></span><span></span></span>';
    el.parentNode?.insertBefore(block, el.nextSibling);
    activeHoverBlock = block;

    // Create abort controller for this request
    const abort = new AbortController();
    pendingAbort = abort;

    try {
      const response = await sendToBackground<TranslationResult>({
        type: 'TRANSLATE_REQUEST',
        payload: {
          texts: [originalText],
          sourceLang: 'auto',
          targetLang,
        },
      }) as MessageResponse<TranslationResult>;

      // Check if this request was cancelled while waiting
      if (abort.signal.aborted) return;

      if (response.success && response.data.translatedTexts[0]) {
        const translated = response.data.translatedTexts[0];

        // Skip if translation is identical to original (same language)
        if (translated.trim().toLowerCase() === originalText.trim().toLowerCase()) {
          block.remove();
          el.removeAttribute('data-immersive-translated');
          el.removeAttribute('data-immersive-hover');
          return;
        }

        block.classList.remove('it-loading');
        block.setAttribute('lang', targetLang);
        block.textContent = translated;
      } else {
        block.classList.remove('it-loading');
        block.classList.add('it-error');
        block.textContent = 'Translation failed';
      }
    } catch (err) {
      if (abort.signal.aborted) return;
      block.classList.remove('it-loading');
      block.classList.add('it-error');
      block.textContent = 'Translation failed';
      console.error('[LinguaFlow] Hover translate error:', (err as Error).message);
    }
  }, DEBOUNCE_MS);
}

function handleMouseLeave(e: Event): void {
  const el = e.target as HTMLElement;

  // Cancel pending hover if mouse leaves before debounce fires
  if (el === activeHoverEl && hoverTimer) {
    cancelPending();
  }
}
