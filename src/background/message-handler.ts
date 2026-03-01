import { MessageToBackground, MessageResponse } from '@/types/messages';
import { translateTexts, translateImage, validateEngine, explainGrammar } from './translation-service';
import { getSettings, updateSettings } from '@/shared/storage';
import { clearCache, getCacheStats } from '@/shared/cache';
import { GoogleTranslateEngine } from '@/engines/google-translate';
import { TranslationEngine } from '@/types/translation';
import { logger } from '@/shared/logger';

export function setupMessageHandler(): void {
  chrome.runtime.onMessage.addListener(
    (
      message: MessageToBackground,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response: MessageResponse) => void
    ): boolean => {
      handleMessage(message, sender)
        .then(sendResponse)
        .catch((err) => {
          logger.error('Message handler error:', err);
          sendResponse({ success: false, error: (err as Error).message });
        });

      return true; // Keep the message channel open for async response
    }
  );
}

async function handleMessage(
  message: MessageToBackground,
  sender: chrome.runtime.MessageSender
): Promise<MessageResponse> {
  switch (message.type) {
    case 'TRANSLATE_REQUEST': {
      const { texts, sourceLang, targetLang, engine } = message.payload;
      const tabId = sender.tab?.id;
      
      const onStream = tabId ? (chunk: string) => {
        chrome.tabs.sendMessage(tabId, {
          type: 'TRANSLATION_STREAM_CHUNK',
          payload: { chunk }
        });
      } : undefined;

      const result = await translateTexts(texts, sourceLang, targetLang, engine, onStream);
      return { success: true, data: result };
    }

    case 'TRANSLATE_IMAGE_REQUEST': {
      const { imageBase64, sourceLang, targetLang, engine } = message.payload;
      const result = await translateImage(imageBase64, sourceLang, targetLang, engine);
      return { success: true, data: result };
    }

    case 'EXPLAIN_GRAMMAR_REQUEST': {
      const { text, sourceLang, targetLang } = message.payload;
      const explanation = await explainGrammar(text, sourceLang, targetLang);
      return { success: true, data: explanation };
    }

    case 'GET_SETTINGS': {
      const settings = await getSettings();
      return { success: true, data: settings };
    }

    case 'UPDATE_SETTINGS': {
      const updated = await updateSettings(message.payload);
      return { success: true, data: updated };
    }

    case 'VALIDATE_ENGINE': {
      const validation = await validateEngine(message.payload.engine);
      return { success: true, data: validation };
    }

    case 'CLEAR_CACHE': {
      await clearCache();
      return { success: true, data: null };
    }

    case 'GET_CACHE_STATS': {
      const stats = await getCacheStats();
      return { success: true, data: stats };
    }

    case 'DETECT_LANGUAGE': {
      const engine = new GoogleTranslateEngine({ engine: TranslationEngine.GOOGLE_FREE });
      const lang = await engine.detectLanguage(message.payload.text);
      return { success: true, data: lang };
    }

    default:
      return { success: false, error: `Unknown message type: ${(message as { type: string }).type}` };
  }
}
