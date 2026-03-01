import { sendToBackground } from '@/shared/message-bus';
import { MessageResponse } from '@/types/messages';
import { getSettings } from '@/shared/storage';
import './image-translator.css';

export async function showImageTranslationModal(srcUrl: string, sourceLang: string, targetLang: string) {
  // Create overlay container
  const overlay = document.createElement('div');
  overlay.className = 'it-image-overlay';
  
  const modal = document.createElement('div');
  modal.className = 'it-image-modal';
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'it-image-close';
  closeBtn.innerHTML = '×';
  closeBtn.onclick = () => document.body.removeChild(overlay);
  
  const imgContainer = document.createElement('div');
  imgContainer.className = 'it-image-container';
  const img = document.createElement('img');
  img.src = srcUrl;
  imgContainer.appendChild(img);
  
  const textContainer = document.createElement('div');
  textContainer.className = 'it-image-text';
  textContainer.innerHTML = '<div class="it-spinner"></div><p>Translating image...</p>';

  modal.appendChild(closeBtn);
  modal.appendChild(imgContainer);
  modal.appendChild(textContainer);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  try {
    // We need to convert the image to base64
    // If it's not a data URL, we fetch it and read as blob -> data URL
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
    const engine = settings.engine;

    const response = await sendToBackground<string>({
      type: 'TRANSLATE_IMAGE_REQUEST',
      payload: { imageBase64, sourceLang, targetLang, engine }
    }) as MessageResponse<string>;

    if (response.success) {
      const formattedText = response.data?.replace(/\n/g, '<br>') || 'No text found';
      textContainer.innerHTML = `<div class="it-image-result">${formattedText}</div>`;
    } else {
      textContainer.innerHTML = `<p style="color: red;">Error: ${response.error || 'Failed to translate image'}</p>`;
    }

  } catch (err) {
    textContainer.innerHTML = `<p style="color: red;">Error: ${(err as Error).message}</p>`;
  }
}
