import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LibreTranslateEngine } from '@/engines/libre-engine';
import { TranslationEngine } from '@/types/translation';

describe('LibreTranslateEngine', () => {
  let engine: LibreTranslateEngine;

  beforeEach(() => {
    engine = new LibreTranslateEngine({ engine: TranslationEngine.LIBRE_TRANSLATE });
    vi.restoreAllMocks();
  });

  it('has max batch size of 1', () => {
    expect(engine.getMaxBatchSize()).toBe(1);
  });

  it('translates a single text', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ translatedText: 'Hola' }),
    }));

    const result = await engine.translate(['Hello'], 'en', 'es');
    expect(result).toEqual(['Hola']);
  });

  it('sends correct POST body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ translatedText: 'Hola' }),
    }));

    await engine.translate(['Hello'], 'en', 'es');
    const call = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(call[1].body);
    expect(body.q).toBe('Hello');
    expect(body.source).toBe('en');
    expect(body.target).toBe('es');
    expect(body.format).toBe('text');
  });

  it('uses auto for source lang detection', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ translatedText: 'Hello' }),
    }));

    await engine.translate(['Hola'], 'auto', 'en');
    const call = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(call[1].body);
    expect(body.source).toBe('auto');
  });

  it('includes api_key when provided', async () => {
    const engineWithKey = new LibreTranslateEngine({
      engine: TranslationEngine.LIBRE_TRANSLATE,
      apiKey: 'my-libre-key',
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ translatedText: 'Hola' }),
    }));

    await engineWithKey.translate(['Hello'], 'en', 'es');
    const call = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(call[1].body);
    expect(body.api_key).toBe('my-libre-key');
  });

  it('supports custom endpoint', async () => {
    const customEngine = new LibreTranslateEngine({
      engine: TranslationEngine.LIBRE_TRANSLATE,
      customEndpoint: 'https://my-libre.local',
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ translatedText: 'Hola' }),
    }));

    await customEngine.translate(['Hello'], 'en', 'es');
    const url = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toBe('https://my-libre.local/translate');
  });

  it('throws on 403 with helpful message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: () => Promise.resolve('Forbidden'),
    }));

    await expect(engine.translate(['Hello'], 'en', 'es')).rejects.toThrow('API key required or invalid');
  });

  it('throws on 429 rate limit', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: () => Promise.resolve('Too many requests'),
    }));

    await expect(engine.translate(['Hello'], 'en', 'es')).rejects.toThrow('Rate limit exceeded');
  });

  it('validates config successfully', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ translatedText: 'Hola' }),
    }));

    const result = await engine.validateConfig();
    expect(result).toEqual({ valid: true });
  });
});
