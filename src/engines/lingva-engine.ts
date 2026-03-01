import { BaseTranslationEngine } from './base-engine';

/**
 * Lingva Translate engine.
 * A free, privacy-focused proxy for Google Translate.
 * Supports custom instances (self-hosted or public mirrors).
 * No API key required.
 */
export class LingvaEngine extends BaseTranslationEngine {
  private static readonly DEFAULT_INSTANCE = 'https://lingva.ml';

  getMaxBatchSize(): number {
    return 1; // Lingva only supports one text per request
  }

  private getBaseUrl(): string {
    return (this.config.customEndpoint ?? LingvaEngine.DEFAULT_INSTANCE).replace(/\/+$/, '');
  }

  async translate(
    texts: string[],
    sourceLang: string,
    targetLang: string
  ): Promise<string[]> {
    // Process up to 5 in parallel (same as Google free)
    const results: string[] = [];
    const parallelism = 5;

    for (let i = 0; i < texts.length; i += parallelism) {
      const batch = texts.slice(i, i + parallelism);
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
    retries = 2
  ): Promise<string> {
    const sl = sourceLang === 'auto' ? 'auto' : sourceLang;
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}/api/v1/${sl}/${targetLang}/${encodeURIComponent(text)}`;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          if (response.status === 429 && attempt < retries - 1) {
            await this.delay(1000 * Math.pow(2, attempt));
            continue;
          }
          throw new Error(`Lingva Translate HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.translation ?? '';
      } catch (err) {
        if (attempt === retries - 1) throw err;
        await this.delay(1000 * Math.pow(2, attempt));
      }
    }

    throw new Error('Lingva Translate failed after retries');
  }

  async validateConfig(): Promise<{ valid: boolean; error?: string }> {
    try {
      await this.translateSingle('hello', 'en', 'es', 1);
      return { valid: true };
    } catch (err) {
      return { valid: false, error: (err as Error).message };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
