import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClaudeEngine } from '@/engines/claude-engine';
import { TranslationEngine } from '@/types/translation';

describe('ClaudeEngine', () => {
  let engine: ClaudeEngine;

  beforeEach(() => {
    engine = new ClaudeEngine({
      engine: TranslationEngine.CLAUDE,
      apiKey: 'test-key',
    });
    vi.restoreAllMocks();
  });

  it('has max batch size of 10', () => {
    expect(engine.getMaxBatchSize()).toBe(10);
  });

  it('translates a single text', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        content: [{ text: 'Hola' }],
      }),
    }));

    const result = await engine.translate(['Hello'], 'en', 'es');
    expect(result).toEqual(['Hola']);
  });

  it('translates multiple texts with separator', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        content: [{ text: 'Hola\n---SPLIT---\nMundo' }],
      }),
    }));

    const result = await engine.translate(['Hello', 'World'], 'en', 'es');
    expect(result).toEqual(['Hola', 'Mundo']);
  });

  it('sends x-api-key header', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        content: [{ text: 'Hola' }],
      }),
    }));

    await engine.translate(['Hello'], 'en', 'es');
    const headers = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].headers;
    expect(headers['x-api-key']).toBe('test-key');
    expect(headers['anthropic-version']).toBe('2023-06-01');
  });

  it('uses default model claude-sonnet-4-5', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        content: [{ text: 'Hola' }],
      }),
    }));

    await engine.translate(['Hello'], 'en', 'es');
    const body = JSON.parse((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.model).toBe('claude-sonnet-4-5-20250514');
  });

  it('throws on API error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Unauthorized'),
    }));

    await expect(engine.translate(['Hello'], 'en', 'es')).rejects.toThrow(
      'Claude API error 401'
    );
  });

  it('validates config returns invalid when no API key', async () => {
    const noKeyEngine = new ClaudeEngine({
      engine: TranslationEngine.CLAUDE,
    });

    const result = await noKeyEngine.validateConfig();
    expect(result).toEqual({ valid: false, error: 'API key is required' });
  });
});
