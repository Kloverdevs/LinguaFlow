import { BaseTranslationEngine } from './base-engine';
import { LANGUAGES } from '@/constants/languages';

const SEPARATOR = '\n---SPLIT---\n';

export class OpenAIEngine extends BaseTranslationEngine {
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

    const endpoint = this.config.customEndpoint ?? 'https://api.openai.com/v1/chat/completions';
    const model = this.config.model ?? 'gpt-4o-mini';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${text}`);
    }

    const data = await response.json();
    const content: string = data.choices[0]?.message?.content ?? '';

    if (texts.length === 1) {
      return [content.trim()];
    }

    const parts = content.split(SEPARATOR.trim()).map((s: string) => s.trim());
    // If split didn't work, return the whole thing as a single result
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
