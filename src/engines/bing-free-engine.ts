import { BaseTranslationEngine } from './base-engine';

/**
 * Bing/Microsoft Translator FREE engine.
 * Uses the Edge browser's free translation endpoint — no API key required.
 * Token is fetched from Microsoft Edge's auth endpoint and cached for 10 minutes.
 */
export class BingFreeEngine extends BaseTranslationEngine {
  private static cachedToken: string | null = null;
  private static tokenExpiry = 0;

  /** Clear cached auth token (useful for testing) */
  static resetCache(): void {
    BingFreeEngine.cachedToken = null;
    BingFreeEngine.tokenExpiry = 0;
  }

  getMaxBatchSize(): number {
    return 25; // Same as official Microsoft API
  }

  async translate(
    texts: string[],
    sourceLang: string,
    targetLang: string
  ): Promise<string[]> {
    const token = await this.getAuthToken();
    const from = sourceLang === 'auto' ? '' : `&from=${sourceLang}`;
    const url = `https://api-edge.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${targetLang}${from}`;

    const body = texts.map((text) => ({ Text: text }));

    const response = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      // Token might have expired — retry once with fresh token
      if (response.status === 401) {
        BingFreeEngine.cachedToken = null;
        const freshToken = await this.getAuthToken();
        const retryResponse = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${freshToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        if (!retryResponse.ok) {
          throw new Error(`Bing Translate HTTP ${retryResponse.status}`);
        }
        const data = await retryResponse.json();
        // The Bing API returns an array of translation results, one for each input text.
        // We'll assume a successful response means all items were processed.
        return data.map((item: { translations: { text: string }[] }, index: number) =>
          item?.translations?.[0]?.text ?? texts[index]
        );
      }
      throw new Error(`Bing Translate HTTP ${response.status}`);
    }

    const data = await response.json();
    // The Bing API returns an array of translation results, one for each input text.
    // If an individual translation fails, the API typically returns a successful response (200 OK)
    // but with an error property for that specific item, or an empty translation.
    // We'll assume a successful response means all items were processed,
    // and if a translation is missing or malformed for an item, we'll return the original text.
    return data.map((item: { translations: { text: string }[] }, index: number) =>
      item?.translations?.[0]?.text ?? texts[index]
    );
  }

  private async getAuthToken(): Promise<string> {
    if (BingFreeEngine.cachedToken && Date.now() < BingFreeEngine.tokenExpiry) {
      return BingFreeEngine.cachedToken;
    }

    const response = await fetch('https://edge.microsoft.com/translate/auth', {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to get Bing auth token: HTTP ${response.status}`);
    }

    const token = await response.text();
    BingFreeEngine.cachedToken = token;
    // Cache for 10 minutes (tokens last ~15 min)
    BingFreeEngine.tokenExpiry = Date.now() + 10 * 60 * 1000;

    return token;
  }

  async validateConfig(): Promise<{ valid: boolean; error?: string }> {
    try {
      await this.translate(['hello'], 'en', 'es');
      return { valid: true };
    } catch (err) {
      return { valid: false, error: (err as Error).message };
    }
  }

  async detectLanguage(text: string): Promise<string | null> {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(
        'https://api-edge.cognitive.microsofttranslator.com/detect?api-version=3.0',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([{ Text: text.slice(0, 200) }]),
        }
      );
      if (!response.ok) return null;
      const data = await response.json();
      return data[0]?.language ?? null;
    } catch {
      return null;
    }
  }
}
