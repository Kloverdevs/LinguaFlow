import { BaseTranslationEngine } from './base-engine';
import { logger } from '@/shared/logger';

export class GoogleTranslateEngine extends BaseTranslationEngine {
  getMaxBatchSize(): number {
    return 20; 
  }

  async translate(
    texts: string[],
    sourceLang: string,
    targetLang: string
  ): Promise<string[]> {
    const results: string[] = [];
    const batchSize = this.getMaxBatchSize();

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const translations = await this.translateBatchStr(batch, sourceLang, targetLang);
      results.push(...translations);
    }

    return results;
  }

  private async translateBatchStr(
    batch: string[],
    sourceLang: string,
    targetLang: string,
    retries = 3
  ): Promise<string[]> {
    const sl = sourceLang === 'auto' ? 'auto' : sourceLang;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${targetLang}&dt=t`;
    // Join batch with double newline to enforce paragraph preservation by Google Translate API
    const joinedText = batch.join('\n\n');

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const params = new URLSearchParams();
        params.append('q', joinedText);
        
        const response = await this.fetchWithTimeout(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
          body: params.toString()
        });
        
        if (!response.ok) {
          if (response.status === 429 && attempt < retries - 1) {
            await this.delay(1000 * Math.pow(2, attempt));
            continue;
          }
          throw new Error(`Google Translate HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (Array.isArray(data) && Array.isArray(data[0])) {
          const translatedFull = data[0]
            .map((segment: [string]) => segment[0])
            .join('');
            
          const translatedArray = translatedFull.split('\n\n');
          
          if (translatedArray.length !== batch.length) {
            logger.warn('Google Translate swallowed batch delimiters. Returning original batch.');
            return batch;
          }
          
          return translatedArray;
        }
      } catch (err) {
        if (attempt === retries - 1) throw err;
        await this.delay(1000 * Math.pow(2, attempt));
      }
    }

    throw new Error('Google Translate failed after retries');
  }

  async validateConfig(): Promise<{ valid: boolean; error?: string }> {
    try {
      await this.translateBatchStr(['hello'], 'en', 'es', 1);
      return { valid: true };
    } catch (err) {
      return { valid: false, error: (err as Error).message };
    }
  }

  async detectLanguage(text: string): Promise<string | null> {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text.slice(0, 200))}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      // Detected language is at data[2]
      return data[2] ?? null;
    } catch {
      return null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
