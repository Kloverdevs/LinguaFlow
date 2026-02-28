import { BaseTranslationEngine } from './base-engine';

export class MicrosoftTranslateEngine extends BaseTranslationEngine {
  getMaxBatchSize(): number {
    return 25;
  }

  async translate(
    texts: string[],
    sourceLang: string,
    targetLang: string
  ): Promise<string[]> {
    const apiKey = this.config.apiKey;
    if (!apiKey) throw new Error('Microsoft Translator API key not set');

    const from = sourceLang === 'auto' ? '' : `&from=${sourceLang}`;
    const url = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${targetLang}${from}`;

    const body = texts.map((text) => ({ Text: text }));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errBody = await response.text();
      if (response.status === 401) {
        throw new Error('Microsoft Translator API key is invalid. Please check your API key in Settings.');
      }
      throw new Error(`Microsoft Translator HTTP ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    return data.map((item: { translations: { text: string }[] }) =>
      item.translations[0].text
    );
  }

  async validateConfig(): Promise<{ valid: boolean; error?: string }> {
    try {
      await this.translate(['hello'], 'en', 'es');
      return { valid: true };
    } catch (err) {
      return { valid: false, error: (err as Error).message };
    }
  }
}
