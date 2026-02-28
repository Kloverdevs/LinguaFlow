import { describe, it, expect } from 'vitest';
import {
  shouldExcludeElement,
  detectTextScript,
  isSubstantiveText,
  getPageLanguage,
} from '@/content/content-detector';

describe('shouldExcludeElement', () => {
  it('excludes script elements', () => {
    const el = document.createElement('script');
    expect(shouldExcludeElement(el)).toBe(true);
  });

  it('excludes style elements', () => {
    const el = document.createElement('style');
    expect(shouldExcludeElement(el)).toBe(true);
  });

  it('excludes input elements', () => {
    const el = document.createElement('input');
    expect(shouldExcludeElement(el)).toBe(true);
  });

  it('excludes textarea elements', () => {
    const el = document.createElement('textarea');
    expect(shouldExcludeElement(el)).toBe(true);
  });

  it('excludes code elements', () => {
    const el = document.createElement('code');
    expect(shouldExcludeElement(el)).toBe(true);
  });

  it('excludes pre elements', () => {
    const el = document.createElement('pre');
    expect(shouldExcludeElement(el)).toBe(true);
  });

  it('does not exclude paragraph elements', () => {
    const el = document.createElement('p');
    expect(shouldExcludeElement(el)).toBe(false);
  });

  it('does not exclude div elements', () => {
    const el = document.createElement('div');
    expect(shouldExcludeElement(el)).toBe(false);
  });

  it('does not exclude navigation role (translatable nav text)', () => {
    const el = document.createElement('div');
    el.setAttribute('role', 'navigation');
    expect(shouldExcludeElement(el)).toBe(false);
  });

  it('excludes search role', () => {
    const el = document.createElement('div');
    el.setAttribute('role', 'search');
    expect(shouldExcludeElement(el)).toBe(true);
  });

  it('excludes menu role', () => {
    const el = document.createElement('div');
    el.setAttribute('role', 'menu');
    expect(shouldExcludeElement(el)).toBe(true);
  });

  it('excludes elements with aria-hidden=true', () => {
    const el = document.createElement('div');
    el.setAttribute('aria-hidden', 'true');
    expect(shouldExcludeElement(el)).toBe(true);
  });

  it('does not exclude elements with aria-hidden=false', () => {
    const el = document.createElement('div');
    el.setAttribute('aria-hidden', 'false');
    expect(shouldExcludeElement(el)).toBe(false);
  });

  it('excludes hidden elements', () => {
    const el = document.createElement('div');
    el.style.display = 'none';
    expect(shouldExcludeElement(el)).toBe(true);
  });

  it('excludes invisible elements', () => {
    const el = document.createElement('div');
    el.style.visibility = 'hidden';
    expect(shouldExcludeElement(el)).toBe(true);
  });

  it('excludes elements with ad-related class names', () => {
    const el = document.createElement('div');
    el.className = 'sidebar-ads';
    expect(shouldExcludeElement(el)).toBe(true);
  });

  it('excludes elements with advertisement class', () => {
    const el = document.createElement('div');
    el.className = 'advertisement-banner';
    expect(shouldExcludeElement(el)).toBe(true);
  });

  it('does not exclude dialog/modal classes (visible content)', () => {
    const el = document.createElement('div');
    el.className = 'modal-dialog';
    expect(shouldExcludeElement(el)).toBe(false);
  });

  it('does not exclude elements with overlay class (visible content)', () => {
    const el = document.createElement('div');
    el.className = 'content-overlay';
    expect(shouldExcludeElement(el)).toBe(false);
  });

  it('does not exclude form role (form labels are translatable)', () => {
    const el = document.createElement('div');
    el.setAttribute('role', 'form');
    expect(shouldExcludeElement(el)).toBe(false);
  });

  it('does not exclude dialog role (dialog content is translatable)', () => {
    const el = document.createElement('div');
    el.setAttribute('role', 'dialog');
    expect(shouldExcludeElement(el)).toBe(false);
  });
});

describe('detectTextScript', () => {
  it('detects Latin text', () => {
    expect(detectTextScript('Hello World')).toBe('latin');
  });

  it('detects CJK text (Chinese)', () => {
    expect(detectTextScript('你好世界')).toBe('cjk');
  });

  it('detects CJK text (Japanese)', () => {
    expect(detectTextScript('こんにちは世界')).toBe('cjk');
  });

  it('detects CJK text (Korean)', () => {
    expect(detectTextScript('안녕하세요')).toBe('cjk');
  });

  it('detects Cyrillic text', () => {
    expect(detectTextScript('Привет мир')).toBe('cyrillic');
  });

  it('detects Arabic text', () => {
    expect(detectTextScript('مرحبا بالعالم')).toBe('arabic');
  });

  it('returns other for empty/whitespace text', () => {
    expect(detectTextScript('   ')).toBe('other');
  });

  it('returns other for numbers only', () => {
    expect(detectTextScript('12345')).toBe('other');
  });
});

describe('isSubstantiveText', () => {
  it('returns false for empty text', () => {
    expect(isSubstantiveText('')).toBe(false);
  });

  it('returns false for whitespace only', () => {
    expect(isSubstantiveText('   ')).toBe(false);
  });

  it('returns true for normal sentence', () => {
    expect(isSubstantiveText('Hello World, this is a test')).toBe(true);
  });

  it('returns false for mostly numbers', () => {
    expect(isSubstantiveText('123 456 789')).toBe(false);
  });

  it('returns false for mostly punctuation', () => {
    expect(isSubstantiveText('---!!!')).toBe(false);
  });

  it('returns true for substantive text with mixed content', () => {
    expect(isSubstantiveText('Version 2.0 released')).toBe(true);
  });

  it('returns true for CJK text (even short)', () => {
    expect(isSubstantiveText('你好')).toBe(true);
  });

  it('returns true for single CJK character headings', () => {
    expect(isSubstantiveText('首页')).toBe(true);
  });

  it('returns true for short Latin words with 2+ letters', () => {
    expect(isSubstantiveText('Home')).toBe(true);
  });

  it('returns false for single letter', () => {
    expect(isSubstantiveText('A')).toBe(false);
  });
});

describe('getPageLanguage', () => {
  it('returns language from html lang attribute', () => {
    document.documentElement.lang = 'en-US';
    expect(getPageLanguage()).toBe('en');
    document.documentElement.lang = '';
  });

  it('returns null when no language is set', () => {
    document.documentElement.lang = '';
    expect(getPageLanguage()).toBe(null);
  });

  it('strips region code from language', () => {
    document.documentElement.lang = 'fr-CA';
    expect(getPageLanguage()).toBe('fr');
    document.documentElement.lang = '';
  });
});
