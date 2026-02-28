import { BaseTranslationEngine } from './base-engine';

export class DeepLEngine extends BaseTranslationEngine {
  getMaxBatchSize(): number {
    return 50;
  }

  private getEndpoint(): string {
    return this.config.customEndpoint ??
      (this.config.apiKey?.endsWith(':fx')
        ? 'https://api-free.deepl.com/v2/translate'
        : 'https://api.deepl.com/v2/translate');
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
      const translated = await this.translateBatch(batch, sourceLang, targetLang);
      results.push(...translated);
    }

    return results;
  }

  private async translateBatch(
    texts: string[],
    sourceLang: string,
    targetLang: string
  ): Promise<string[]> {
    const body: Record<string, unknown> = {
      text: texts,
      target_lang: this.toDeepLLang(targetLang),
    };

    if (sourceLang !== 'auto') {
      body.source_lang = this.toDeepLLang(sourceLang);
    }

    const response = await fetch(this.getEndpoint(), {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      if (response.status === 403) {
        throw new Error('DeepL API key is invalid or unauthorized. Please check your API key in Settings.');
      }
      if (response.status === 456) {
        throw new Error('DeepL quota exceeded. Your free API usage limit has been reached.');
      }
      throw new Error(`DeepL API error ${response.status}: ${text}`);
    }

    const data = await response.json();
    return data.translations.map((t: { text: string }) => t.text);
  }

  async validateConfig(): Promise<{ valid: boolean; error?: string }> {
    if (!this.config.apiKey) {
      return { valid: false, error: 'API key is required' };
    }
    try {
      await this.translateBatch(['hello'], 'en', 'es');
      return { valid: true };
    } catch (err) {
      return { valid: false, error: (err as Error).message };
    }
  }

  private toDeepLLang(lang: string): string {
    // DeepL uses uppercase and some special codes
    const map: Record<string, string> = {
      en: 'EN',
      'en-us': 'EN-US',
      'en-gb': 'EN-GB',
      de: 'DE',
      fr: 'FR',
      es: 'ES',
      pt: 'PT-PT',
      'pt-br': 'PT-BR',
      it: 'IT',
      nl: 'NL',
      pl: 'PL',
      ru: 'RU',
      ja: 'JA',
      zh: 'ZH-HANS',
      'zh-tw': 'ZH-HANT',
      ko: 'KO',
      ar: 'AR',
      cs: 'CS',
      da: 'DA',
      el: 'EL',
      fi: 'FI',
      hu: 'HU',
      id: 'ID',
      ro: 'RO',
      sv: 'SV',
      tr: 'TR',
      uk: 'UK',
    };
    return map[lang.toLowerCase()] ?? lang.toUpperCase();
  }
}
