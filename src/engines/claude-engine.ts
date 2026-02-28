import { BaseTranslationEngine } from './base-engine';
import { LANGUAGES } from '@/constants/languages';

const SEPARATOR = '\n---SPLIT---\n';

export class ClaudeEngine extends BaseTranslationEngine {
  getMaxBatchSize(): number {
    return 10;
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
    const targetName = LANGUAGES.find((l) => l.code === targetLang)?.name ?? targetLang;
    const sourceName = sourceLang === 'auto'
      ? 'the detected language'
      : (LANGUAGES.find((l) => l.code === sourceLang)?.name ?? sourceLang);

    const systemPrompt = `You are a professional translator. Translate the following text(s) from ${sourceName} to ${targetName}.
If multiple texts are provided separated by "${SEPARATOR.trim()}", translate each one independently and return them in the same order, separated by the same delimiter.
Only output the translations, no explanations or extra text.`;

    const userMessage = texts.join(SEPARATOR);

    const endpoint = this.config.customEndpoint ?? 'https://api.anthropic.com/v1/messages';
    const model = this.config.model ?? 'claude-sonnet-4-5-20250514';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey!,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Claude API error ${response.status}: ${text}`);
    }

    const data = await response.json();
    const content: string = data.content?.[0]?.text ?? '';

    if (texts.length === 1) {
      return [content.trim()];
    }

    const parts = content.split(SEPARATOR.trim()).map((s: string) => s.trim());
    if (parts.length !== texts.length) {
      return texts.length === 1 ? [content.trim()] : parts;
    }

    return parts;
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
}
