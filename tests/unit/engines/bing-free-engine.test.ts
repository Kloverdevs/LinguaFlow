import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BingFreeEngine } from '@/engines/bing-free-engine';
import { TranslationEngine } from '@/types/translation';

describe('BingFreeEngine', () => {
  let engine: BingFreeEngine;

  beforeEach(() => {
    BingFreeEngine.resetCache();
    engine = new BingFreeEngine({ engine: TranslationEngine.BING_FREE });
    vi.restoreAllMocks();
  });

  it('has max batch size of 25', () => {
    expect(engine.getMaxBatchSize()).toBe(25);
  });

  it('fetches auth token and translates text', async () => {
    vi.stubGlobal('fetch', vi.fn()
      // First call: auth token
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('mock-token-123'),
      })
      // Second call: translation
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { translations: [{ text: 'Hola' }] },
        ]),
      })
    );

    const result = await engine.translate(['Hello'], 'en', 'es');
    expect(result).toEqual(['Hola']);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('translates multiple texts in a single batch', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('mock-token'),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { translations: [{ text: 'Hola' }] },
          { translations: [{ text: 'Mundo' }] },
        ]),
      })
    );

    const result = await engine.translate(['Hello', 'World'], 'en', 'es');
    expect(result).toEqual(['Hola', 'Mundo']);
  });

  it('uses Bearer auth header', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('test-token'),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { translations: [{ text: 'Hola' }] },
        ]),
      })
    );

    await engine.translate(['Hello'], 'en', 'es');
    const translateCall = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[1];
    expect(translateCall[1].headers.Authorization).toBe('Bearer test-token');
  });

  it('retries with fresh token on 401', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('old-token'),
      })
      // First translate attempt: 401
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
      })
      // Fresh token fetch
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('new-token'),
      })
      // Retry translate
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { translations: [{ text: 'Hola' }] },
        ]),
      })
    );

    const result = await engine.translate(['Hello'], 'en', 'es');
    expect(result).toEqual(['Hola']);
  });

  it('throws on auth token failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }));

    await expect(engine.translate(['Hello'], 'en', 'es')).rejects.toThrow('Failed to get Bing auth token');
  });

  it('validates config with successful translation', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('token'),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ translations: [{ text: 'Hola' }] }]),
      })
    );

    const result = await engine.validateConfig();
    expect(result).toEqual({ valid: true });
  });
});
