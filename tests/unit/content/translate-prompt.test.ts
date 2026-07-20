import { describe, it, expect } from 'vitest';
import { baseLang, shouldPromptTranslate } from '@/content/translate-prompt';

describe('baseLang', () => {
  it('lowercases and strips region subtags', () => {
    expect(baseLang('en-US')).toBe('en');
    expect(baseLang('pt_BR')).toBe('pt');
    expect(baseLang('ZH')).toBe('zh');
  });

  it('returns empty string for nullish input', () => {
    expect(baseLang(null)).toBe('');
    expect(baseLang(undefined)).toBe('');
    expect(baseLang('')).toBe('');
  });
});

describe('shouldPromptTranslate', () => {
  const base = {
    detectedLang: 'fr',
    targetLang: 'en',
    hostname: 'example.com',
    autoSites: [] as string[],
    neverSites: [] as string[],
    dismissedHosts: [] as string[],
    autoDetectPrompt: true,
  };

  it('prompts when detected language differs from target', () => {
    expect(shouldPromptTranslate(base)).toBe(true);
  });

  it('does not prompt when the feature is disabled', () => {
    expect(shouldPromptTranslate({ ...base, autoDetectPrompt: false })).toBe(false);
  });

  it('does not prompt when nothing was detected', () => {
    expect(shouldPromptTranslate({ ...base, detectedLang: null })).toBe(false);
  });

  it('does not prompt when detected base equals target base', () => {
    expect(shouldPromptTranslate({ ...base, detectedLang: 'en-GB', targetLang: 'en' })).toBe(false);
  });

  it('does not prompt for sites already in the auto-translate list', () => {
    expect(shouldPromptTranslate({ ...base, autoSites: ['example.com'] })).toBe(false);
  });

  it('does not prompt for sites in the never-translate list', () => {
    expect(shouldPromptTranslate({ ...base, neverSites: ['example.com'] })).toBe(false);
  });

  it('does not prompt for hosts dismissed this session', () => {
    expect(shouldPromptTranslate({ ...base, dismissedHosts: ['example.com'] })).toBe(false);
  });

  it('treats an undefined autoDetectPrompt as enabled', () => {
    expect(shouldPromptTranslate({ ...base, autoDetectPrompt: undefined })).toBe(true);
  });
});
