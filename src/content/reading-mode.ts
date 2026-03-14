import { Readability } from '@mozilla/readability';
import DOMPurify from 'dompurify';
import { getSettings } from '@/shared/storage';
import { logger } from '@/shared/logger';
import { setTrustedHTML } from './safe-dom';

/** Delay before showing "Translation Active" label after translate button click */
const TRANSLATE_FEEDBACK_MS = 1000;
/** Duration of close animation before removing overlay */
const CLOSE_ANIMATION_MS = 300;

let readerOverlay: HTMLElement | null = null;
let originalBodyOverflow = '';
let readerEscHandler: ((e: KeyboardEvent) => void) | null = null;
let previousFocus: HTMLElement | null = null;

/**
 * Initializes the reader mode if the user clicks the FAB action.
 */
export async function toggleReadingMode() {
  if (readerOverlay) {
    closeReadingMode();
    return;
  }

  try {
    // Clone the document so Readability doesn't destroy the live DOM
    const documentClone = document.cloneNode(true) as Document;
    const reader = new Readability(documentClone);
    const article = reader.parse();

    if (!article || !article.textContent) {
      alert('LinguaFlow could not extract readability content from this page.');
      return;
    }

    // Sanitize the Readability HTML output
    const cleanHtml = DOMPurify.sanitize(article.content || '', {
      USE_PROFILES: { html: true },
      ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div', 'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'img', 'figure', 'figcaption', 'ul', 'ol', 'li', 'blockquote']
    });

    renderReaderUI(article.title || 'Untitled', article.byline || '', cleanHtml as string);

  } catch (err) {
    logger.error('Failed to parse page for Reader Mode:', err);
  }
}

function renderReaderUI(title: string, byline: string, htmlContent: string) {
  readerOverlay = document.createElement('div');
  readerOverlay.className = 'it-reader-overlay';
  readerOverlay.setAttribute('role', 'dialog');
  readerOverlay.setAttribute('aria-modal', 'true');
  readerOverlay.setAttribute('aria-label', 'Reader mode');

  // Build the Header Navigation
  const nav = document.createElement('div');
  nav.className = 'it-reader-nav';
  
  const branding = document.createElement('div');
  branding.className = 'it-reader-branding';
  setTrustedHTML(branding, `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
    </svg>
    LinguaFlow Reader
  `);

  const actions = document.createElement('div');
  actions.className = 'it-reader-actions';
  
  const themeBtn = document.createElement('button');
  themeBtn.className = 'it-reader-btn';
  themeBtn.textContent = 'Toggle Theme';
  themeBtn.onclick = () => readerOverlay?.classList.toggle('it-dark');

  const translateBtn = document.createElement('button');
  translateBtn.className = 'it-reader-btn';
  translateBtn.textContent = 'Translate Article';
  translateBtn.onclick = async () => {
    translateBtn.disabled = true;
    translateBtn.textContent = 'Translating...';
    // Let the main index.ts start the translation.
    // It will walk the DOM inside `readerOverlay` because it walks document.body
    window.postMessage({ type: 'LINGUAFLOW_READER_TRANSLATE' }, window.location.origin);
    setTimeout(() => { translateBtn.textContent = 'Translation Active'; }, TRANSLATE_FEEDBACK_MS);
  };

  const closeBtn = document.createElement('button');
  closeBtn.className = 'it-reader-btn it-reader-close';
  closeBtn.textContent = 'Close';
  closeBtn.onclick = closeReadingMode;

  actions.appendChild(themeBtn);
  actions.appendChild(translateBtn);
  actions.appendChild(closeBtn);
  nav.appendChild(branding);
  nav.appendChild(actions);

  // Build the Content Area
  const container = document.createElement('div');
  container.className = 'it-reader-container';

  const contentWrap = document.createElement('div');
  contentWrap.className = 'it-reader-content';
  
  const titleEl = document.createElement('h1');
  titleEl.className = 'it-reader-title';
  titleEl.textContent = title;
  
  contentWrap.appendChild(titleEl);

  if (byline) {
    const bylineEl = document.createElement('div');
    bylineEl.className = 'it-reader-byline';
    bylineEl.textContent = byline;
    contentWrap.appendChild(bylineEl);
  }

  const articleBody = document.createElement('div');
  setTrustedHTML(articleBody, htmlContent);
  contentWrap.appendChild(articleBody);

  container.appendChild(contentWrap);

  readerOverlay.appendChild(nav);
  readerOverlay.appendChild(container);

  // Lock background scroll
  originalBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  // Save previous focus for restoration
  previousFocus = document.activeElement as HTMLElement;

  document.body.appendChild(readerOverlay);

  // Close on Escape key (stored for cleanup)
  readerEscHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') closeReadingMode();
  };
  document.addEventListener('keydown', readerEscHandler);

  // Animate in and move focus to close button
  requestAnimationFrame(() => {
    readerOverlay?.classList.add('it-show');
    closeBtn.focus();
  });
}

function closeReadingMode() {
  if (!readerOverlay) return;

  // Clean up escape listener
  if (readerEscHandler) {
    document.removeEventListener('keydown', readerEscHandler);
    readerEscHandler = null;
  }

  readerOverlay.classList.remove('it-show');

  setTimeout(() => {
    readerOverlay?.remove();
    readerOverlay = null;
    document.body.style.overflow = originalBodyOverflow;
    // Restore focus to previously focused element
    previousFocus?.focus();
    previousFocus = null;
  }, CLOSE_ANIMATION_MS);
}
