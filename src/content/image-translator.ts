import { sendToBackground } from '@/shared/message-bus';
import { MessageResponse } from '@/types/messages';
import { getSettings } from '@/shared/storage';
import { createWorker, PSM } from 'tesseract.js';
import { ENGINES } from '@/constants/engines';
import { TranslationEngine } from '@/types/translation';
import './image-translator.css';

// Map our language codes to Tesseract codes
function mapLangToTesseract(lang: string): string {
  if (!lang || lang === 'auto') return 'eng';
  const map: Record<string, string> = {
    'en': 'eng', 'es': 'spa', 'fr': 'fra', 'de': 'deu', 'it': 'ita', 
    'pt': 'por', 'ru': 'rus', 'ja': 'jpn', 'zh': 'chi_sim', 'zh-CN': 'chi_sim',
    'zh-TW': 'chi_tra', 'ko': 'kor', 'ar': 'ara', 'nl': 'nld', 'tr': 'tur'
  };
  return map[lang.split('-')[0]] || 'eng';
}

/**
 * Preprocess an image for better OCR results.
 * Grayscale & contrast enhancement via canvas.
 */
async function preprocessImageForOcr(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUrl);

      ctx.filter = 'grayscale(100%) contrast(150%) brightness(110%)';
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

const LANGUAGES = [
  { code: 'auto', name: 'Auto Detect' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh-CN', name: 'Chinese (Simpl)' },
  { code: 'zh-TW', name: 'Chinese (Trad)' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' }
];

export async function showImageTranslationModal(srcUrl: string, initialSourceLang: string, initialTargetLang: string) {
  // Create overlay container
  const overlay = document.createElement('div');
  overlay.className = 'it-image-overlay';
  
  const modal = document.createElement('div');
  modal.className = 'it-image-modal';
  
  const optionsHtml = LANGUAGES.map(l => `<option value="${l.code}">${l.name}</option>`).join('');
  
  // Create engine options logic. Show name. 
  const engineOptionsHtml = ENGINES.map(e => `<option value="${e.id}">${e.name}${!e.requiresKey ? ' (Free)' : ''}</option>`).join('');
  
  modal.innerHTML = `
    <div class="it-image-header">
      <div class="it-image-toolbar">
        <select class="it-lang-select it-engine-select" title="Translation Engine">${engineOptionsHtml}</select>
        <div class="it-toolbar-divider"></div>
        <select class="it-lang-select it-source-lang" title="Source Language">${optionsHtml}</select>
        <span class="it-lang-arrow">→</span>
        <select class="it-lang-select it-target-lang" title="Target Language">${optionsHtml.replace('<option value="auto">Auto Detect</option>', '')}</select>
        <button class="it-retranslate-btn">Translate</button>
      </div>
      <button class="it-image-close" title="Close">×</button>
    </div>
    <div class="it-image-content">
      <div class="it-image-container">
        <img src="${srcUrl}" />
      </div>
      <div class="it-image-text">
        <div class="it-text-source">
          <div class="it-text-label">Extracted Text <span style="opacity:0.6;font-size:12px;font-weight:normal">(Editable)</span></div>
          <textarea class="it-source-textarea" placeholder="Recognized text will appear here..."></textarea>
        </div>
        <div class="it-text-target">
          <div class="it-text-label">Translation</div>
          <div class="it-image-result-container">
            <div class="it-spinner"></div><p>Translating image...</p>
          </div>
        </div>
      </div>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const closeBtn = modal.querySelector('.it-image-close') as HTMLButtonElement;
  const sourceSelect = modal.querySelector('.it-source-lang') as HTMLSelectElement;
  const targetSelect = modal.querySelector('.it-target-lang') as HTMLSelectElement;
  const engineSelect = modal.querySelector('.it-engine-select') as HTMLSelectElement;
  const retranslateBtn = modal.querySelector('.it-retranslate-btn') as HTMLButtonElement;
  const sourceTextarea = modal.querySelector('.it-source-textarea') as HTMLTextAreaElement;
  const resultContainer = modal.querySelector('.it-image-result-container') as HTMLElement;

  closeBtn.onclick = () => document.body.removeChild(overlay);
  
  // Set initial select values
  if (LANGUAGES.some(l => l.code === initialSourceLang)) sourceSelect.value = initialSourceLang;
  if (LANGUAGES.some(l => l.code === initialTargetLang)) targetSelect.value = initialTargetLang;

  try {
    let imageBase64 = srcUrl;
    if (!srcUrl.startsWith('data:')) {
      const resp = await fetch(srcUrl);
      const blob = await resp.blob();
      imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    const settings = await getSettings();
    
    // Set initial engine
    if (ENGINES.some(e => e.id === settings.engine)) engineSelect.value = settings.engine;

    // Extracted text cache to avoid re-running OCR if only targetLang changes
    let cachedExtractedText = '';

    const VISION_PLACEHOLDER = '[Translated directly from image via AI Vision API]';

    const executeTranslation = async () => {
      resultContainer.innerHTML = '<div class="it-spinner"></div><p>Translating image...</p>';
      retranslateBtn.disabled = true;
      const sLang = sourceSelect.value;
      const tLang = targetSelect.value;
      const engine = engineSelect.value as TranslationEngine;

      try {
        // If we already manually OCR'd it (or user edited it), just translate the text
        if (cachedExtractedText) {
          sourceTextarea.value = cachedExtractedText; // ensure UI matches
          resultContainer.innerHTML = '<div class="it-spinner"></div><p>Translating extracted text...</p>';
          const textResp = await sendToBackground<any>({
            type: 'TRANSLATE_REQUEST',
            payload: { texts: [cachedExtractedText], sourceLang: sLang, targetLang: tLang, engine }
          }) as MessageResponse<any>;
          
          if (textResp.success && textResp.data.translatedTexts.length > 0) {
            const formatted = textResp.data.translatedTexts[0].replace(/\n/g, '<br>');
            resultContainer.innerHTML = `<div class="it-image-result">${formatted}</div>`;
          } else {
            throw new Error(!textResp.success ? textResp.error : 'No translation returned');
          }
          retranslateBtn.disabled = false;
          return;
        }

        // Try Vision API translation first
        let response = await sendToBackground<string>({
          type: 'TRANSLATE_IMAGE_REQUEST',
          payload: { imageBase64, sourceLang: sLang, targetLang: tLang, engine }
        }) as MessageResponse<string>;

        if (!response.success && response.error === 'NO_VISION_API_AVAILABLE') {
          // Fallback to local offline OCR
          resultContainer.innerHTML = '<div class="it-spinner"></div><p>Running local offline OCR...</p>';
          sourceTextarea.value = 'Running local offline OCR...';
          
          const tessLang = mapLangToTesseract(sLang);
          const workerBlob = await fetch(chrome.runtime.getURL('tesseract/worker.min.js')).then(r => r.blob());
          const workerBlobUrl = URL.createObjectURL(workerBlob);

          const worker = await createWorker(tessLang, 1, {
            workerPath: workerBlobUrl,
            corePath: chrome.runtime.getURL('tesseract/tesseract-core.wasm.js'),
          });
          
          await worker.setParameters({
            tessedit_pageseg_mode: PSM.AUTO,
          });

          // Enhance the image before giving it to Tesseract
          const processedImage = await preprocessImageForOcr(imageBase64);
          const ret = await worker.recognize(processedImage);
          cachedExtractedText = ret.data.text.trim();
          sourceTextarea.value = cachedExtractedText;
          await worker.terminate();

          if (!cachedExtractedText) {
            throw new Error('OCR Failed: Could not extract any text from the image.');
          }

          // Translate the newly extracted text
          resultContainer.innerHTML = '<div class="it-spinner"></div><p>Translating extracted text...</p>';
          const textResp = await sendToBackground<any>({
            type: 'TRANSLATE_REQUEST',
            payload: { texts: [cachedExtractedText], sourceLang: sLang, targetLang: tLang, engine }
          }) as MessageResponse<any>;
          
          if (textResp.success && textResp.data.translatedTexts.length > 0) {
            response = { success: true, data: textResp.data.translatedTexts[0] };
          } else {
            throw new Error(!textResp.success ? textResp.error : 'No translation returned');
          }
        } else {
           // Vision API succeeded, but it doesn't give us the original text
           sourceTextarea.value = VISION_PLACEHOLDER;
        }

        if (response.success) {
          const formattedText = response.data?.replace(/\n/g, '<br>') || 'No text found';
          resultContainer.innerHTML = `<div class="it-image-result">${formattedText}</div>`;
        } else {
          resultContainer.innerHTML = `<p style="color: #ef4444;">Error: ${response.error || 'Failed to translate image'}</p>`;
        }
      } catch (err) {
        resultContainer.innerHTML = `<p style="color: #ef4444;">Error: ${(err as Error).message}</p>`;
      } finally {
        retranslateBtn.disabled = false;
      }
    };

    let currentSourceLang = sourceSelect.value;
    let currentEngine = engineSelect.value;

    retranslateBtn.onclick = () => {
      // Force OCR re-run if source language changed or engine changed to/from a Vision API
      if (sourceSelect.value !== currentSourceLang || engineSelect.value !== currentEngine) {
        cachedExtractedText = '';
        currentSourceLang = sourceSelect.value;
        currentEngine = engineSelect.value;
        sourceTextarea.value = '';
      } else {
        const val = sourceTextarea.value.trim();
        if (val !== VISION_PLACEHOLDER && val !== 'Running local offline OCR...') {
          cachedExtractedText = val;
        }
      }
      executeTranslation();
    };

    // Auto-run translation on open
    await executeTranslation();



  } catch (err) {
    const fallbackContainer = modal.querySelector('.it-image-result-container') || modal.querySelector('.it-image-text');
    if (fallbackContainer) {
      fallbackContainer.innerHTML = `<p style="color: #ef4444;">Error: ${(err as Error).message}</p>`;
    }
  }
}
