import { describe, it, expect, vi, beforeEach } from 'vitest';
import { YandexEngine } from '@/engines/yandex-engine';
import { TranslationEngine } from '@/types/translation';

describe('YandexEngine', () => {
  let engine: YandexEngine;

  beforeEach(() => {
    YandexEngine.resetCache();
    engine = new YandexEngine({ engine: TranslationEngine.YANDEX });
    vi.restoreAllMocks();
  });

  it('has max batch size of 10', () => {
    expect(engine.getMaxBatchSize()).toBe(10);
  });

  it('fetches SID and translates text', async () => {
    vi.stubGlobal('fetch', vi.fn()
      // First call: get SID from Yandex page
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('var SID = "abc.def.ghi";'),
      })
      // Second call: translation
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ text: ['Hola'] }),
      })
    );

    const result = await engine.translate(['Hello'], 'en', 'es');
    expect(result).toEqual(['Hola']);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('reverses SID components', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('SID = "abc.def";'),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ text: ['Hola'] }),
      })
    );

    await engine.translate(['Hello'], 'en', 'es');
    const translateUrl = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[1][0] as string;
    // abc reversed = cba, def reversed = fed
    expect(translateUrl).toContain('sid=cba.fed');
  });

  it('translates multiple texts using text params', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('SID = "abc.def";'),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ text: ['Hola', 'Mundo'] }),
      })
    );

    const result = await engine.translate(['Hello', 'World'], 'en', 'es');
    expect(result).toEqual(['Hola', 'Mundo']);
  });

  it('uses target lang only when source is auto', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('SID = "abc.def";'),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ text: ['Hello'] }),
      })
    );

    await engine.translate(['Hola'], 'auto', 'en');
    const url = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[1][0] as string;
    expect(url).toContain('lang=en');
    expect(url).not.toContain('lang=auto-en');
  });

  it('throws when SID cannot be extracted', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('<html>no SID here</html>'),
    }));

    await expect(engine.translate(['Hello'], 'en', 'es')).rejects.toThrow('Could not extract Yandex SID');
  });

  it('validates config successfully', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('SID = "abc.def";'),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ text: ['Hola'] }),
      })
    );

    const result = await engine.validateConfig();
    expect(result).toEqual({ valid: true });
  });
});
