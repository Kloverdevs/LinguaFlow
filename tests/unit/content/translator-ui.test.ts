import { describe, it, expect, beforeEach } from 'vitest';
import {
  showLoading,
  replaceLoading,
  showError,
  removeAllTranslations,
  setDisplayMode,
} from '@/content/translator-ui';

describe('translator-ui', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.innerHTML = '';
    document.body.appendChild(container);
    setDisplayMode('replace');
  });

  describe('showLoading (replace mode)', () => {
    it('adds loading class to element', () => {
      const el = document.createElement('p');
      el.textContent = 'Hello world';
      container.appendChild(el);

      const loader = showLoading(el);
      expect(loader).toBe(el);
      expect(el.classList.contains('immersive-translate-loading')).toBe(true);
      expect(el.getAttribute('data-immersive-translated')).toBe('true');
    });

    it('stores original HTML', () => {
      const el = document.createElement('p');
      el.innerHTML = '<strong>Hello</strong> world';
      container.appendChild(el);

      showLoading(el);
      expect(el.getAttribute('data-immersive-original-html')).toBe(
        '<strong>Hello</strong> world'
      );
    });
  });

  describe('showLoading (bilingual mode)', () => {
    it('inserts a loading block after the element', () => {
      setDisplayMode('bilingual');
      const el = document.createElement('p');
      el.textContent = 'Hello world';
      container.appendChild(el);

      const loader = showLoading(el);
      expect(loader).not.toBe(el);
      expect(loader.classList.contains('it-bilingual-block')).toBe(true);
      expect(loader.classList.contains('it-loading')).toBe(true);
      expect(loader.getAttribute('data-immersive-block')).toBe('true');
      expect(el.nextSibling).toBe(loader);
    });
  });

  describe('replaceLoading (replace mode)', () => {
    it('replaces element text with translation', () => {
      const el = document.createElement('p');
      el.textContent = 'Hello world';
      container.appendChild(el);

      const loader = showLoading(el);
      replaceLoading(loader, 'Hola mundo', 'es');

      expect(el.textContent).toBe('Hola mundo');
      expect(el.getAttribute('lang')).toBe('es');
      expect(el.classList.contains('immersive-translate-loading')).toBe(false);
    });
  });

  describe('replaceLoading (bilingual mode)', () => {
    it('replaces loading block with translation text', () => {
      setDisplayMode('bilingual');
      const el = document.createElement('p');
      el.textContent = 'Hello world';
      container.appendChild(el);

      const loader = showLoading(el);
      replaceLoading(loader, 'Hola mundo', 'es');

      expect(loader.textContent).toBe('Hola mundo');
      expect(loader.getAttribute('lang')).toBe('es');
      expect(loader.classList.contains('it-loading')).toBe(false);
      // Original should be untouched
      expect(el.textContent).toBe('Hello world');
    });
  });

  describe('showError (replace mode)', () => {
    it('restores original HTML on error', () => {
      const el = document.createElement('p');
      el.innerHTML = '<strong>Hello</strong>';
      container.appendChild(el);

      const loader = showLoading(el);
      showError(loader, 'Test error');

      expect(el.innerHTML).toBe('<strong>Hello</strong>');
      expect(el.hasAttribute('data-immersive-translated')).toBe(false);
    });
  });

  describe('showError (bilingual mode)', () => {
    it('shows error state in bilingual block', () => {
      setDisplayMode('bilingual');
      const el = document.createElement('p');
      el.textContent = 'Hello';
      container.appendChild(el);

      const loader = showLoading(el);
      showError(loader, 'Test error');

      expect(loader.classList.contains('it-error')).toBe(true);
      expect(loader.textContent).toBe('Translation failed');
    });
  });

  describe('replaceLoading (replace mode with interactive children)', () => {
    it('preserves link elements when replacing text', () => {
      const el = document.createElement('p');
      el.innerHTML = 'Click <a href="/page">here</a> for more';
      container.appendChild(el);

      const loader = showLoading(el);
      replaceLoading(loader, 'Haz clic aqui para mas', 'es');

      // The <a> tag should still exist
      const link = el.querySelector('a');
      expect(link).not.toBeNull();
      expect(link?.getAttribute('href')).toBe('/page');
    });

    it('preserves button elements when replacing text', () => {
      const el = document.createElement('div');
      el.innerHTML = 'Some text <button>Submit</button>';
      container.appendChild(el);

      const loader = showLoading(el);
      replaceLoading(loader, 'Algun texto', 'es');

      const btn = el.querySelector('button');
      expect(btn).not.toBeNull();
    });
  });

  describe('showError (bilingual mode, silent)', () => {
    it('removes block silently when error is empty', () => {
      setDisplayMode('bilingual');
      const el = document.createElement('p');
      el.textContent = 'Hello';
      container.appendChild(el);

      const loader = showLoading(el);
      showError(loader, '');

      // Block should be removed
      expect(container.querySelectorAll('[data-immersive-block]').length).toBe(0);
    });
  });

  describe('showLoading (bilingual mode, inline element)', () => {
    it('uses span for inline elements in bilingual mode', () => {
      setDisplayMode('bilingual');
      const el = document.createElement('span');
      el.textContent = 'Hello world';
      container.appendChild(el);

      const loader = showLoading(el);
      expect(loader.tagName).toBe('SPAN');
      expect(loader.classList.contains('it-inline-block')).toBe(true);
    });

    it('uses div for block elements in bilingual mode', () => {
      setDisplayMode('bilingual');
      const el = document.createElement('p');
      el.textContent = 'Hello world';
      container.appendChild(el);

      const loader = showLoading(el);
      expect(loader.tagName).toBe('DIV');
      expect(loader.classList.contains('it-inline-block')).toBe(false);
    });
  });

  describe('removeAllTranslations', () => {
    it('removes bilingual blocks', () => {
      setDisplayMode('bilingual');
      const el = document.createElement('p');
      el.textContent = 'Hello';
      container.appendChild(el);

      const loader = showLoading(el);
      replaceLoading(loader, 'Hola', 'es');
      expect(container.querySelectorAll('[data-immersive-block]').length).toBe(1);

      removeAllTranslations();
      expect(container.querySelectorAll('[data-immersive-block]').length).toBe(0);
    });

    it('restores replaced elements', () => {
      const el = document.createElement('p');
      el.innerHTML = '<em>Hello World</em>';
      container.appendChild(el);

      const loader = showLoading(el);
      replaceLoading(loader, 'Hola mundo', 'es');
      expect(el.textContent).toBe('Hola mundo');

      removeAllTranslations();
      expect(el.innerHTML).toBe('<em>Hello World</em>');
      expect(el.hasAttribute('data-immersive-translated')).toBe(false);
      expect(el.hasAttribute('data-immersive-original-html')).toBe(false);
    });

    it('cleans up hover attributes', () => {
      const el = document.createElement('p');
      el.textContent = 'Hello';
      container.appendChild(el);

      el.setAttribute('data-immersive-translated', 'true');
      el.setAttribute('data-immersive-hover', 'true');

      removeAllTranslations();
      expect(el.hasAttribute('data-immersive-hover')).toBe(false);
    });
  });
});
