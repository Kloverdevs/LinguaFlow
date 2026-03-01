import { BaseTranslationEngine } from './base-engine';

/**
 * LibreTranslate engine.
 * Open-source, self-hostable translation engine using Argos Translate models.
 * Supports ~45 languages. Can use public instances or private deployments.
 * API key is optional (depends on instance configuration).
 */
export class LibreTranslateEngine extends BaseTranslationEngine {
  private static readonly DEFAULT_INSTANCE = 'https://libretranslate.com';

  getMaxBatchSize(): number {
    return 1; // LibreTranslate processes one text per request
  }

  private getBaseUrl(): string {
    return (this.config.customEndpoint ?? LibreTranslateEngine.DEFAULT_INSTANCE).replace(/\/+$/, '');
  }

  async translate(
    texts: string[],
    sourceLang: string,
    targetLang: string
  ): Promise<string[]> {
    // Process up to 3 in parallel
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
    const url = `${this.getBaseUrl()}/translate`;

    const body: Record<string, string> = {
      q: text,
      source: sourceLang === 'auto' ? 'auto' : sourceLang,
      target: targetLang,
      format: 'text',
    };

    if (this.config.apiKey) {
      body.api_key = this.config.apiKey;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      if (response.status === 403) {
        throw new Error('LibreTranslate: API key required or invalid');
      }
      if (response.status === 429) {
        throw new Error('LibreTranslate: Rate limit exceeded');
      }
      throw new Error(`LibreTranslate HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return data.translatedText ?? '';
  }

  async validateConfig(): Promise<{ valid: boolean; error?: string }> {
    try {
      await this.translateSingle('hello', 'en', 'es');
      return { valid: true };
    } catch (err) {
      return { valid: false, error: (err as Error).message };
    }
  }

  async detectLanguage(text: string): Promise<string | null> {
    try {
      const url = `${this.getBaseUrl()}/detect`;
      const body: Record<string, string> = { q: text.slice(0, 200) };
      if (this.config.apiKey) body.api_key = this.config.apiKey;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data[0]?.language ?? null;
    } catch {
      return null;
    }
  }
}
