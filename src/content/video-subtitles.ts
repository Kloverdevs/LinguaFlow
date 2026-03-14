import { logger } from '@/shared/logger';
import { getSettings } from '@/shared/storage';
import { sendToBackground } from '@/shared/message-bus';
import { TranslationResult } from '@/types/translation';

let observer: MutationObserver | null = null;
let bodyObserver: MutationObserver | null = null;
let currentLanguage = 'en';

// Batching state — collect lines over a short window then translate together
let pendingLines: { line: Element; text: string; transDiv: HTMLElement }[] = [];
let batchTimer: ReturnType<typeof setTimeout> | null = null;
const BATCH_DELAY = 100; // ms to wait before flushing batch

export async function initVideoSubtitles() {
  if (!window.location.hostname.includes('youtube.com')) return;

  const settings = await getSettings();
  currentLanguage = settings.targetLang;

  logger.info('Initializing YouTube Dual Subtitles');

  bodyObserver = new MutationObserver(() => {
    const captionContainer = document.querySelector('.ytp-caption-window-container');
    if (captionContainer && !observer) {
      bodyObserver?.disconnect();
      bodyObserver = null;
      setupCaptionObserver(captionContainer);
    }
  });
  bodyObserver.observe(document.body, { childList: true, subtree: true });
}

export function updateVideoSubtitleLanguage(lang: string) {
  currentLanguage = lang;
}

function setupCaptionObserver(container: Element) {
  if (observer) {
    observer.disconnect();
  }

  observer = new MutationObserver(() => {
    processCaptions(container);
  });

  // YouTube recreates windows and visual lines very often
  observer.observe(container, { childList: true, subtree: true, characterData: true });
}

function processCaptions(container: Element) {
  // Use a tiny delay to allow YouTube to finish building the line
  setTimeout(() => {
    const lines = container.querySelectorAll('.caption-visual-line');

    lines.forEach((line) => {
      const originalText = getOriginalText(line);
      if (!originalText) return;

      const existingTrans = line.querySelector('.it-yt-translation');
      // If text hasn't changed, skip
      if (existingTrans && existingTrans.getAttribute('data-original') === originalText) {
        return;
      }

      // If text changed or no translation div exists, set up loading
      let transDiv = existingTrans as HTMLElement;
      if (!transDiv) {
        transDiv = document.createElement('div');
        transDiv.className = 'it-yt-translation it-loading';
        line.appendChild(transDiv);
      }

      transDiv.setAttribute('data-original', originalText);
      transDiv.textContent = '...';

      // Add to batch instead of translating immediately
      pendingLines.push({ line, text: originalText, transDiv });
    });

    // Schedule batch flush
    if (pendingLines.length > 0 && !batchTimer) {
      batchTimer = setTimeout(flushBatch, BATCH_DELAY);
    }
  }, 50);
}

async function flushBatch() {
  batchTimer = null;
  if (pendingLines.length === 0) return;

  const batch = pendingLines.splice(0);
  const texts = batch.map((b) => b.text);

  try {
    const resp = await sendToBackground<TranslationResult>({
      type: 'TRANSLATE_REQUEST',
      payload: { texts, sourceLang: 'auto', targetLang: currentLanguage },
    });

    if (resp && resp.success && resp.data.translatedTexts.length === batch.length) {
      batch.forEach((item, i) => {
        // Ensure the text hasn't changed again before we got the response
        if (item.transDiv.getAttribute('data-original') !== item.text) return;
        item.transDiv.textContent = resp.data.translatedTexts[i];
        item.transDiv.classList.remove('it-loading');
      });
    } else {
      // Remove loading indicators on failure
      batch.forEach((item) => {
        if (item.transDiv.getAttribute('data-original') === item.text) {
          item.transDiv.remove();
        }
      });
    }
  } catch {
    batch.forEach((item) => {
      if (item.transDiv.getAttribute('data-original') === item.text) {
        item.transDiv.remove();
      }
    });
  }
}

function getOriginalText(lineElement: Element): string {
  // YouTube caption lines usually contain .ytp-caption-segment elements
  const segments = Array.from(lineElement.querySelectorAll('.ytp-caption-segment'));
  if (segments.length === 0) return '';

  return segments.map(s => s.textContent || '').join(' ').replace(/\s+/g, ' ').trim();
}
