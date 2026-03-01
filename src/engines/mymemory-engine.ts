import { BaseTranslationEngine } from './base-engine';

/**
 * MyMemory Translation Memory engine.
 * Free tier: 5,000 chars/day anonymous, 50,000 chars/day with email.
 * Uses crowdsourced translation memory with machine translation fallback.
 * No API key required (email is optional for higher quota).
 */
export class MyMemoryEngine extends BaseTranslationEngine {
  getMaxBatchSize(): number {
    return 1; // MyMemory only supports one text per request
  }

  async translate(
    texts: string[],
    sourceLang: string,
    targetLang: string
  ): Promise<string[]> {
    // Process up to 3 in parallel (conservative to avoid rate limits)
    const results: string[] = [];
    const parallelism = 3;

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
    targetLang: string
  ): Promise<string> {
    const sl = sourceLang === 'auto' ? 'en' : sourceLang; // MyMemory doesn't support auto-detect
    const langPair = `${sl}|${targetLang}`;
    let url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langPair)}`;

    // If user provides an API key, it's treated as their email for higher quota
    if (this.config.apiKey) {
      url += `&de=${encodeURIComponent(this.config.apiKey)}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`MyMemory HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.responseStatus !== 200) {
      throw new Error(data.responseDetails || `MyMemory error: status ${data.responseStatus}`);
    }

    return data.responseData?.translatedText ?? '';
  }

  async validateConfig(): Promise<{ valid: boolean; error?: string }> {
    try {
      await this.translateSingle('hello', 'en', 'es');
      return { valid: true };
    } catch (err) {
      return { valid: false, error: (err as Error).message };
    }
  }
}
