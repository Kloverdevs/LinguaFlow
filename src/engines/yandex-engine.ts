import { BaseTranslationEngine } from './base-engine';

/**
 * Yandex Translate FREE engine.
 * Uses the free web widget endpoint — no API key required.
 * Obtains a session ID (SID) by scraping Yandex's translate page.
 */
export class YandexEngine extends BaseTranslationEngine {
  private static cachedSid: string | null = null;
  private static sidExpiry = 0;

  /** Clear cached SID (useful for testing) */
  static resetCache(): void {
    YandexEngine.cachedSid = null;
    YandexEngine.sidExpiry = 0;
  }

  getMaxBatchSize(): number {
    return 10; // Yandex limits batch via URL length
  }

  async translate(
    texts: string[],
    sourceLang: string,
    targetLang: string
  ): Promise<string[]> {
    const sid = await this.getSid();
    const sl = sourceLang === 'auto' ? '' : sourceLang;
    const lang = sl ? `${sl}-${targetLang}` : targetLang;

    // Yandex supports multiple &text= params for batch
    const textParams = texts.map((t) => `text=${encodeURIComponent(t)}`).join('&');
    const url = `https://translate.yandex.net/api/v1/tr.json/translate?srv=tr-url-widget&sid=${sid}&lang=${lang}&${textParams}`;

    const response = await fetch(url);

    if (!response.ok) {
      // SID might be stale — retry with fresh SID
      if (response.status === 403 || response.status === 401) {
        YandexEngine.cachedSid = null;
        const freshSid = await this.getSid();
        const retryUrl = `https://translate.yandex.net/api/v1/tr.json/translate?srv=tr-url-widget&sid=${freshSid}&lang=${lang}&${textParams}`;
        const retryResponse = await fetch(retryUrl);
        if (!retryResponse.ok) {
          throw new Error(`Yandex Translate HTTP ${retryResponse.status}`);
        }
        const data = await retryResponse.json();
        return data.text as string[];
      }
      throw new Error(`Yandex Translate HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.text as string[];
  }

  private async getSid(): Promise<string> {
    if (YandexEngine.cachedSid && Date.now() < YandexEngine.sidExpiry) {
      return YandexEngine.cachedSid;
    }

    const response = await fetch('https://translate.yandex.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get Yandex SID: HTTP ${response.status}`);
    }

    const html = await response.text();
    // Extract SID from the page — it's in a script tag like: SID = 'abc123.def456';
    const match = html.match(/SID\s*[:=]\s*['"]([^'"]+)['"]/);
    if (!match) {
      throw new Error('Could not extract Yandex SID from page');
    }

    // Reverse the SID components (Yandex obfuscation)
    const sid = match[1]
      .split('.')
      .map((part) => part.split('').reverse().join(''))
      .join('.');

    YandexEngine.cachedSid = sid;
    // Cache for 30 minutes
    YandexEngine.sidExpiry = Date.now() + 30 * 60 * 1000;

    return sid;
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
