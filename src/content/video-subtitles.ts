import { logger } from '@/shared/logger';
import { getSettings } from '@/shared/storage';
import { sendToBackground } from '@/shared/message-bus';
import { TranslationResult } from '@/types/translation';

let observer: MutationObserver | null = null;
let currentLanguage = 'en';

export async function initVideoSubtitles() {
  if (!window.location.hostname.includes('youtube.com')) return;
  
  const settings = await getSettings();
  currentLanguage = settings.targetLang;
  
  logger.info('Initializing YouTube Dual Subtitles');

  const bodyObserver = new MutationObserver(() => {
    const captionContainer = document.querySelector('.ytp-caption-window-container');
    if (captionContainer && !observer) {
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

async function processCaptions(container: Element) {
  // Use a tiny delay to allow YouTube to finish building the line
  setTimeout(() => {
    const lines = container.querySelectorAll('.caption-visual-line');
    
    lines.forEach(async (line) => {
      // If we already added a translation container, update it if needed 
      // but to be safe, if we've processed this exact DOM node, skip unless text changed
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

      try {
        const resp = await sendToBackground<TranslationResult>({
          type: 'TRANSLATE_REQUEST',
          payload: { texts: [originalText], sourceLang: 'auto', targetLang: currentLanguage },
        });

        // Ensure the text hasn't changed again before we got the response
        if (transDiv.getAttribute('data-original') !== originalText) return;

        if (resp && resp.success && resp.data.translatedTexts.length > 0) {
          transDiv.textContent = resp.data.translatedTexts[0];
          transDiv.classList.remove('it-loading');
        } else {
          transDiv.remove();
        }
      } catch (e) {
        if (transDiv.getAttribute('data-original') === originalText) {
          transDiv.remove();
        }
      }
    });
  }, 50);
}

function getOriginalText(lineElement: Element): string {
  // YouTube caption lines usually contain .ytp-caption-segment elements
  const segments = Array.from(lineElement.querySelectorAll('.ytp-caption-segment'));
  if (segments.length === 0) return '';
  
  return segments.map(s => s.textContent || '').join(' ').replace(/\s+/g, ' ').trim();
}
