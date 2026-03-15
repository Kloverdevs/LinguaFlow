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
    targetLang: string,
    onStream?: (chunk: string) => void
  ): Promise<string[]> {
    const results: string[] = [];
    const batchSize = this.getMaxBatchSize();

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const translated = await this.translateBatch(batch, sourceLang, targetLang, onStream);
      results.push(...translated);
    }

    return results;
  }

  private async translateBatch(
    texts: string[],
    sourceLang: string,
    targetLang: string,
    onStream?: (chunk: string) => void
  ): Promise<string[]> {
    const targetName = LANGUAGES.find((l) => l.code === targetLang)?.name ?? targetLang;
    const sourceName = sourceLang === 'auto'
      ? 'the detected language'
      : (LANGUAGES.find((l) => l.code === sourceLang)?.name ?? sourceLang);

    const formalityInstruction = this.config.formality === 'formal'
      ? '\nUse formal register and polite forms (e.g., "vous" in French, "usted" in Spanish, "Sie" in German, polite forms in Japanese/Korean).'
      : this.config.formality === 'informal'
        ? '\nUse informal/casual register (e.g., "tu" in French, "tu" in Spanish, "du" in German, casual forms in Japanese/Korean).'
        : '';

    const customPromptInstruction = this.config.customPrompt 
      ? `\n\nAdditional Instructions:\n${this.config.customPrompt}`
      : '';

    const systemPrompt = `You are an expert translator producing natural, publication-quality translations from ${sourceName} to ${targetName}.

Rules:
- Preserve the original tone, intent, and style (humor, sarcasm, formality).
- Translate idioms and cultural references into natural equivalents in the target language rather than translating literally.
- Preserve any HTML tags, markdown formatting, or special characters exactly as they appear.
- Do not add explanations, notes, or commentary — output only the translated text.${formalityInstruction}
${texts.length > 1 ? `- Multiple texts are separated by "${SEPARATOR.trim()}". Translate each independently and return them in the same order with the same delimiter.` : ''}${customPromptInstruction}`;

    const userMessage = texts.join(SEPARATOR);

    const endpoint = this.config.customEndpoint ?? 'https://api.anthropic.com/v1/messages';
    const model = this.config.model ?? 'claude-sonnet-4-5-20250514';

    const response = await this.fetchWithRetry(endpoint, {
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
        stream: !!onStream,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Claude API error ${response.status}: ${text}`);
    }

    let content = '';

    if (onStream && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                  content += parsed.delta.text;
                  onStream(parsed.delta.text);
                }
              } catch (e) {
                // ignore parse errors mid-stream
              }
            }
          }
        }
      } finally {
        reader.cancel().catch(() => {});
      }
    } else {
      const data = await response.json();
      content = data.content?.[0]?.text ?? '';
    }

    if (texts.length === 1) {
      return [content.trim()];
    }

    const parts = content.split(SEPARATOR.trim()).map((s: string) => s.trim());
    if (parts.length !== texts.length) {
      return texts.length === 1 ? [content.trim()] : parts;
    }

    return parts;
  }

  async explain(text: string, sourceLang: string, targetLang: string): Promise<string> {
    const targetName = LANGUAGES.find((l) => l.code === targetLang)?.name ?? targetLang;
    const sourceName = sourceLang === 'auto'
      ? 'the detected language'
      : (LANGUAGES.find((l) => l.code === sourceLang)?.name ?? sourceLang);

    const systemPrompt = `You are an expert language teacher. Explain the grammar, vocabulary, and sentence structure of the provided text from ${sourceName} (translated to ${targetName}). Keep it concise, formatted in markdown, and highlight key grammar rules or interesting idioms used. Do not translate the whole sentence again unless necessary for explanation.`;

    const endpoint = this.config.customEndpoint ?? 'https://api.anthropic.com/v1/messages';
    const model = this.config.model ?? 'claude-sonnet-4-5-20250514';

    const response = await this.fetchWithRetry(endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey!,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1500,
        system: systemPrompt,
        messages: [
          { role: 'user', content: text },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Claude API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text ?? '';
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

  async translateImage(imageBase64: string, sourceLang: string, targetLang: string): Promise<string> {
    const targetName = LANGUAGES.find((l) => l.code === targetLang)?.name ?? targetLang;
    const sourceName = sourceLang === 'auto'
      ? 'the detected language'
      : (LANGUAGES.find((l) => l.code === sourceLang)?.name ?? sourceLang);

    const systemPrompt = `You are an OCR translation expert. Extract all text from this image and translate it from ${sourceName} to ${targetName}. Keep the original formatting and layout as much as possible, using markdown. ONLY output the translated text, do not add any conversational words or explanations.`;

    const endpoint = this.config.customEndpoint ?? 'https://api.anthropic.com/v1/messages';
    const model = this.config.model ?? 'claude-3-5-sonnet-20241022'; // Vision model
    
    const match = imageBase64.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
    if (!match) throw new Error('Invalid image base64 format. Expected data:image/...;base64,...');
    const mediaType = match[1];
    const data = match[2];

    const response = await this.fetchWithRetry(endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey!,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: data,
                }
              },
              { type: 'text', text: systemPrompt }
            ]
          }
        ],
      }),
    }, 60000);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Claude Vision API error ${response.status}: ${errText}`);
    }

    const responseData = await response.json();
    return responseData.content?.[0]?.text?.trim() ?? '';
  }
}
