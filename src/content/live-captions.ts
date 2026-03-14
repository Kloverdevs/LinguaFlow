import { logger } from '@/shared/logger';
import { getSettings } from '@/shared/storage';
import { sendToBackground } from '@/shared/message-bus';
import { TranslationResult } from '@/types/translation';

let observer: MutationObserver | null = null;
let bodyObserver: MutationObserver | null = null;
let currentLanguage = 'en';
let captionContainerSelector = '';
let textSpanSelector = '';

// Map of original string to the HTML element we created to show its translation
const translationNodes = new WeakMap<Element, HTMLElement>();

// Basic debounce map for text nodes to prevent API spam while text is still streaming in
const pendingTranslations = new Map<Element, number>();

export async function initLiveCaptions() {
  const hostname = window.location.hostname;

  if (hostname.includes('meet.google.com')) {
    // Meet often puts captions inside an element with jsname="tGAh7c" or similar
    // We can also target any aria-live="polite" region inside .a4cQT
    captionContainerSelector = '.a4cQT, div[jsname="tGAh7c"]';
    textSpanSelector = 'span[jsname="to2sEb"], span.CNusmb, .T8HiB'; 
  } else if (hostname.includes('zoom.us') || hostname.includes('zoom.gov')) {
    captionContainerSelector = '.closed-caption-container, .caption-text-container';
    textSpanSelector = '.caption-text, span, p';
  } else {
    return;
  }

  const settings = await getSettings();
  currentLanguage = settings.targetLang;

  logger.info(`Initializing Live Captions for ${hostname}`);

  bodyObserver = new MutationObserver(() => {
    const captionContainer = document.querySelector(captionContainerSelector);
    if (captionContainer && !observer) {
      bodyObserver?.disconnect();
      bodyObserver = null;
      setupCaptionObserver(captionContainer);
    }
  });

  bodyObserver.observe(document.body, { childList: true, subtree: true });
}

export function updateLiveCaptionsLanguage(lang: string) {
  currentLanguage = lang;
}

function setupCaptionObserver(container: Element) {
  if (observer) {
    observer.disconnect();
  }

  observer = new MutationObserver((mutations) => {
    // Process new nodes or text data changes
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            checkAndTranslateElement(node as Element);
          }
        });
      } else if (mutation.type === 'characterData') {
        const parent = mutation.target.parentElement;
        if (parent) {
          checkAndTranslateElement(parent);
        }
      }
    }
    
    // Fallback: periodically scan the container just in case
    debounceScan(container);
  });

  observer.observe(container, { childList: true, subtree: true, characterData: true });
}

let scanTimeout: number | null = null;
function debounceScan(container: Element) {
  if (scanTimeout) clearTimeout(scanTimeout);
  scanTimeout = window.setTimeout(() => {
    const spans = container.querySelectorAll(textSpanSelector);
    spans.forEach(checkAndTranslateElement);
  }, 200);
}

function checkAndTranslateElement(element: Element) {
  // Try to find if it matches our span selector, or query inside it
  let targetElements: Element[] = [];
  
  if (element.matches && element.matches(textSpanSelector)) {
    targetElements.push(element);
  } else if (element.querySelectorAll) {
    targetElements = Array.from(element.querySelectorAll(textSpanSelector));
  }

  targetElements.forEach((el) => {
    // Ignore our own translation divs
    if (el.classList.contains('it-live-translation') || el.closest('.it-live-translation')) return;

    const originalText = el.textContent?.trim();
    if (!originalText || originalText.length < 2) return;

    const existingId = pendingTranslations.get(el);
    if (existingId) window.clearTimeout(existingId);

    // Provide a small debounce to wait for a sentence fragment to complete
    const timeoutId = window.setTimeout(() => {
      translateSegment(el, originalText);
    }, 400);

    pendingTranslations.set(el, timeoutId);
  });
}

async function translateSegment(element: Element, originalText: string) {
  let transDiv = translationNodes.get(element);

  // If text hasn't changed, ignore
  if (transDiv && transDiv.getAttribute('data-original') === originalText) {
    return;
  }

  if (!transDiv) {
    transDiv = document.createElement('div');
    transDiv.className = 'it-live-translation';
    transDiv.style.color = 'var(--it-text-color, #007aff)';
    transDiv.style.fontSize = '0.9em';
    transDiv.style.marginTop = '4px';
    transDiv.style.fontStyle = 'italic';
    // Append it right after the element if possible
    element.appendChild(transDiv);
    translationNodes.set(element, transDiv);
  }

  transDiv.setAttribute('data-original', originalText);
  transDiv.textContent = '...';

  try {
    const resp = await sendToBackground<TranslationResult>({
      type: 'TRANSLATE_REQUEST',
      payload: { texts: [originalText], sourceLang: 'auto', targetLang: currentLanguage },
    });

    if (transDiv.getAttribute('data-original') !== originalText) return;

    if (resp && resp.success && resp.data.translatedTexts.length > 0) {
      transDiv.textContent = resp.data.translatedTexts[0];
    } else {
      transDiv.remove();
      translationNodes.delete(element);
    }
  } catch (e) {
    if (transDiv.getAttribute('data-original') === originalText) {
      transDiv.remove();
      translationNodes.delete(element);
    }
  }
}
