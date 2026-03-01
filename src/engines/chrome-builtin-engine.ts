import { BaseTranslationEngine } from './base-engine';
import { logger } from '@/shared/logger';

// Type definitions for the experimental Chrome translation API
type TranslatorAvailability = 'readily' | 'after-download' | 'no';

interface ChromeTranslator {
  translate(text: string): Promise<string>;
  destroy(): void;
}

interface ChromeTranslation {
  canTranslate(options: { sourceLanguage: string; targetLanguage: string }): Promise<TranslatorAvailability>;
  createTranslator(options: { sourceLanguage: string; targetLanguage: string }): Promise<ChromeTranslator>;
}

declare global {
  interface Window {
    translation?: ChromeTranslation;
    ai?: {
      translator?: ChromeTranslation;
    };
  }
}

export class ChromeBuiltinEngine extends BaseTranslationEngine {
  getMaxBatchSize(): number {
    return 1; // Translate one by one as API doesn't support batching natively
  }

  private getTranslationApi(): ChromeTranslation | undefined {
    // Current API surface on self/window object as of Chrome early 2025
    if (typeof self !== 'undefined') {
      const globalObj = self as unknown as Window;
      return globalObj.translation || globalObj.ai?.translator;
    }
    return undefined;
  }

  async translate(texts: string[], sourceLang: string, targetLang: string): Promise<string[]> {
    const api = this.getTranslationApi();
    
    if (!api) {
      throw new Error('Chrome Built-in Translator API is not available in your browser version. Enable the #translation-api flag in chrome://flags.');
    }

    // Chrome API expects 'en', 'es', etc. It does not support 'auto' directly yet in some versions, 
    // but the spec suggests leaving sourceLanguage undefined or empty might work for auto-detect in the future.
    // For now, we will default auto to English or allow the API to reject it.
    const sl = sourceLang === 'auto' ? 'en' : sourceLang.split('-')[0];
    const tl = targetLang.split('-')[0]; // Chrome API expects base language codes usually

    let availability: TranslatorAvailability;
    try {
      availability = await api.canTranslate({
        sourceLanguage: sl,
        targetLanguage: tl,
      });
    } catch (e) {
      throw new Error(`Failed to check language support: ${(e as Error).message}`);
    }

    if (availability === 'no') {
      throw new Error(`Chrome cannot translate from ${sl} to ${tl}. Language pair not supported.`);
    }

    if (availability === 'after-download') {
      logger.info(`Downloading language model for ${sl} -> ${tl}...`);
      // Note: createTranslator will automatically trigger the download if needed
    }

    let translator: ChromeTranslator | null = null;
    try {
      translator = await api.createTranslator({
        sourceLanguage: sl,
        targetLanguage: tl,
      });

      const results: string[] = [];
      for (const text of texts) {
        if (!text.trim()) {
          results.push(text);
          continue;
        }
        const translated = await translator.translate(text);
        results.push(translated);
      }
      return results;
    } catch (e) {
      throw new Error(`Chrome translation failed: ${(e as Error).message}`);
    } finally {
      if (translator) {
        translator.destroy();
      }
    }
  }

  async validateConfig(): Promise<{ valid: boolean; error?: string }> {
    const api = this.getTranslationApi();
    if (!api) {
      return { 
        valid: false, 
        error: 'Chrome built-in translator API not found. Please ensure you are using Chrome 131+ and have the necessary experimental flags enabled (chrome://flags/#translation-api).' 
      };
    }
    return { valid: true };
  }
}
