import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleTranslateEngine } from '@/engines/google-translate';
import { TranslationEngine } from '@/types/translation';

describe('GoogleTranslateEngine', () => {
  let engine: GoogleTranslateEngine;

  beforeEach(() => {
    engine = new GoogleTranslateEngine({ engine: TranslationEngine.GOOGLE_FREE });
    vi.restoreAllMocks();
  });

  it('has max batch size of 1', () => {
    expect(engine.getMaxBatchSize()).toBe(1);
  });

  it('translates a single text', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([[['Hola', 'Hello']]]),
    }));

    const result = await engine.translate(['Hello'], 'en', 'es');
    expect(result).toEqual(['Hola']);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('translates multiple texts sequentially', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([[['Hola', 'Hello']]]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([[['Mundo', 'World']]]),
      })
    );

    const result = await engine.translate(['Hello', 'World'], 'en', 'es');
    expect(result).toEqual(['Hola', 'Mundo']);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('joins multi-segment responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([[['Part one. ', 'Part one.'], ['Part two.', 'Part two.']]]),
    }));

    const result = await engine.translate(['Part one. Part two.'], 'en', 'es');
    expect(result).toEqual(['Part one. Part two.']);
  });

  it('uses auto for source lang when set to auto', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([[['Hola', 'Hello']]]),
    }));

    await engine.translate(['Hello'], 'auto', 'es');
    const url = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('sl=auto');
  });

  it('throws on HTTP error after retries', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }));

    await expect(engine.translate(['Hello'], 'en', 'es')).rejects.toThrow('Google Translate HTTP 500');
  });

  it('validates config successfully on good response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([[['Hola', 'hello']]]),
    }));

    const result = await engine.validateConfig();
    expect(result).toEqual({ valid: true });
  });

  it('validates config with error on failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }));

    const result = await engine.validateConfig();
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('detects language from response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([[['Hello', 'Hola']], null, 'es']),
    }));

    const lang = await engine.detectLanguage('Hola');
    expect(lang).toBe('es');
  });
});
