import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LingvaEngine } from '@/engines/lingva-engine';
import { TranslationEngine } from '@/types/translation';

describe('LingvaEngine', () => {
  let engine: LingvaEngine;

  beforeEach(() => {
    engine = new LingvaEngine({ engine: TranslationEngine.LINGVA });
    vi.restoreAllMocks();
  });

  it('has max batch size of 1', () => {
    expect(engine.getMaxBatchSize()).toBe(1);
  });

  it('translates a single text', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ translation: 'Hola' }),
    }));

    const result = await engine.translate(['Hello'], 'en', 'es');
    expect(result).toEqual(['Hola']);
  });

  it('uses correct API URL format', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ translation: 'Hola' }),
    }));

    await engine.translate(['Hello'], 'en', 'es');
    const url = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('/api/v1/en/es/');
  });

  it('uses auto for source lang detection', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ translation: 'Hello' }),
    }));

    await engine.translate(['Hola'], 'auto', 'en');
    const url = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('/api/v1/auto/en/');
  });

  it('supports custom endpoint', async () => {
    const customEngine = new LingvaEngine({
      engine: TranslationEngine.LINGVA,
      customEndpoint: 'https://my-lingva.example.com',
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ translation: 'Hola' }),
    }));

    await customEngine.translate(['Hello'], 'en', 'es');
    const url = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('my-lingva.example.com');
  });

  it('translates multiple texts in parallel', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ translation: 'Hola' }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ translation: 'Mundo' }) })
    );

    const result = await engine.translate(['Hello', 'World'], 'en', 'es');
    expect(result).toEqual(['Hola', 'Mundo']);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('throws on HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }));

    await expect(engine.translate(['Hello'], 'en', 'es')).rejects.toThrow('Lingva Translate HTTP 500');
  });
});
