import { BaseTranslationEngine } from './base-engine';

export class GoogleTranslateEngine extends BaseTranslationEngine {
  getMaxBatchSize(): number {
    return 1; // One text per request due to URL length limits
  }

  async translate(
    texts: string[],
    sourceLang: string,
    targetLang: string
  ): Promise<string[]> {
    const results: string[] = [];
    // Process up to 5 in parallel
    const batchSize = 5;

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const translations = await Promise.all(
        batch.map((text) => this.translateSingle(text, sourceLang, targetLang))
      );
      results.push(...translations);
    }

    return results;
  }

  private async translateSingle(
    text: string,
    sourceLang: string,
    targetLang: string,
    retries = 3
  ): Promise<string> {
    const sl = sourceLang === 'auto' ? 'auto' : sourceLang;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          if (response.status === 429 && attempt < retries - 1) {
            await this.delay(1000 * Math.pow(2, attempt));
            continue;
          }
          throw new Error(`Google Translate HTTP ${response.status}`);
        }

        const data = await response.json();
        // Response format: [[["translated text","original text",null,null,10]],null,"en"]
        if (Array.isArray(data) && Array.isArray(data[0])) {
          return data[0]
            .map((segment: [string]) => segment[0])
            .join('');
        }
        throw new Error('Unexpected response format');
      } catch (err) {
        if (attempt === retries - 1) throw err;
        await this.delay(1000 * Math.pow(2, attempt));
      }
    }

    throw new Error('Google Translate failed after retries');
  }

  async validateConfig(): Promise<{ valid: boolean; error?: string }> {
    try {
      await this.translateSingle('hello', 'en', 'es', 1);
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
