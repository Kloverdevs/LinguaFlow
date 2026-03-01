import { describe, it, expect } from 'vitest';
import { DEFAULT_SETTINGS } from '@/constants/defaults';
import { TranslationEngine } from '@/types/translation';

describe('DEFAULT_SETTINGS', () => {
  it('has correct default source language', () => {
    expect(DEFAULT_SETTINGS.sourceLang).toBe('auto');
  });

  it('has correct default target language', () => {
    expect(DEFAULT_SETTINGS.targetLang).toBe('en');
  });

  it('uses Google Free as default engine', () => {
    expect(DEFAULT_SETTINGS.engine).toBe(TranslationEngine.GOOGLE_FREE);
  });

  it('has hover mode disabled by default', () => {
    expect(DEFAULT_SETTINGS.hoverMode).toBe(false);
  });

  it('uses replace display mode by default', () => {
    expect(DEFAULT_SETTINGS.displayMode).toBe('replace');
  });

  it('has correct default translation style', () => {
    expect(DEFAULT_SETTINGS.translationStyle.fontSize).toBe(0.92);
    expect(DEFAULT_SETTINGS.translationStyle.fontFamily).toBe('inherit');
    expect(DEFAULT_SETTINGS.translationStyle.color).toBe('#555555');
    expect(DEFAULT_SETTINGS.translationStyle.borderColor).toBe('#4a90d9');
    expect(DEFAULT_SETTINGS.translationStyle.italic).toBe(true);
  });

  it('has onboarding not completed by default', () => {
    expect(DEFAULT_SETTINGS.onboardingCompleted).toBe(false);
  });

  it('uses system theme by default', () => {
    expect(DEFAULT_SETTINGS.theme).toBe('system');
  });

  it('shows both free and paid engines by default', () => {
    expect(DEFAULT_SETTINGS.showFreeEngines).toBe(true);
    expect(DEFAULT_SETTINGS.showPaidEngines).toBe(true);
  });

  it('has empty auto/never translate site lists', () => {
    expect(DEFAULT_SETTINGS.autoTranslateSites).toEqual([]);
    expect(DEFAULT_SETTINGS.neverTranslateSites).toEqual([]);
  });

  it('has popup scale of 1', () => {
    expect(DEFAULT_SETTINGS.popupScale).toBe(1);
  });

  it('uses auto UI locale by default', () => {
    expect(DEFAULT_SETTINGS.uiLocale).toBe('auto');
  });

  it('has FAB enabled by default', () => {
    expect(DEFAULT_SETTINGS.fabEnabled).toBe(true);
  });

  it('has default FAB size of 48px', () => {
    expect(DEFAULT_SETTINGS.fabSize).toBe(48);
  });

  it('has empty engine configs', () => {
    expect(DEFAULT_SETTINGS.engineConfigs).toEqual({});
  });
});
