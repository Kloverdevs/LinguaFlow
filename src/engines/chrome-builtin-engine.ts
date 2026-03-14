import browser from 'webextension-polyfill';
import { BaseTranslationEngine } from './base-engine';
import { MessageResponse } from '@/types/messages';
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

  async translate(texts: string[], sourceLang: string, targetLang: string): Promise<string[]> {
    if (this.config.tabId) {
      // Proxy the request to the content script running in the active tab since SW can't access window.ai
      const response = await browser.tabs.sendMessage(this.config.tabId, {
        type: 'EXECUTE_CHROME_BUILTIN',
        payload: { texts, sourceLang, targetLang }
      }) as MessageResponse<string[]> | undefined;
      if (response && !response.success) {
        throw new Error(response.error);
      }
      return response && response.success ? response.data : texts.map(() => 'Error routing offline translation to page context.');
    }
    
    throw new Error('Chrome Built-in engine cannot run in this context without a target tab.');
  }

  async validateConfig(): Promise<{ valid: boolean; error?: string }> {
    return { valid: true }; // Content script checks actual validity at runtime
  }
}
