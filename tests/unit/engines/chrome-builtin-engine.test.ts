import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChromeBuiltinEngine } from '../../../src/engines/chrome-builtin-engine';
import { TranslationEngine } from '../../../src/types/translation';

describe('ChromeBuiltinEngine', () => {
  let engine: ChromeBuiltinEngine;

  beforeEach(() => {
    engine = new ChromeBuiltinEngine({
      engine: TranslationEngine.CHROME_BUILTIN,
      tabId: 1
    });
    vi.clearAllMocks();
  });

  it('has max batch size of 1', () => {
    expect(engine.getMaxBatchSize()).toBe(1);
  });

  it('validates config implicitly', async () => {
    const result = await engine.validateConfig();
    expect(result.valid).toBe(true);
  });

  it('proxies translate call correctly to content script', async () => {
    vi.mocked(chrome.tabs.sendMessage).mockResolvedValueOnce({
      success: true,
      data: ['Hola', 'Mundo']
    });

    const result = await engine.translate(['Hello', 'World'], 'en', 'es');
    
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, {
      type: 'EXECUTE_CHROME_BUILTIN',
      payload: { texts: ['Hello', 'World'], sourceLang: 'en', targetLang: 'es' }
    });
    expect(result).toEqual(['Hola', 'Mundo']);
  });

  it('throws an error if content script responds with failure', async () => {
    vi.mocked(chrome.tabs.sendMessage).mockResolvedValueOnce({
      success: false,
      error: 'Simulated failure'
    });

    await expect(engine.translate(['Hello'], 'en', 'es')).rejects.toThrow('Simulated failure');
  });

  it('throws if no tabId exists', async () => {
    const headlessEngine = new ChromeBuiltinEngine({
      engine: TranslationEngine.CHROME_BUILTIN
    });
    await expect(headlessEngine.translate(['Hello'], 'en', 'es'))
      .rejects.toThrow('Chrome Built-in engine cannot run in this context without a target tab.');
  });
});
