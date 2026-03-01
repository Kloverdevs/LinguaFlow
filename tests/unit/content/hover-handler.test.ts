import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { enableHover, disableHover, updateHoverLang } from '@/content/hover-handler';

describe('hover-handler', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    disableHover();
  });

  describe('enableHover', () => {
    it('adds mouseenter and mouseleave listeners to document', () => {
      const spy = vi.spyOn(document, 'addEventListener');
      enableHover('es');
      expect(spy).toHaveBeenCalledWith('mouseenter', expect.any(Function), true);
      expect(spy).toHaveBeenCalledWith('mouseleave', expect.any(Function), true);
    });
  });

  describe('disableHover', () => {
    it('removes mouseenter and mouseleave listeners from document', () => {
      enableHover('es');
      const spy = vi.spyOn(document, 'removeEventListener');
      disableHover();
      expect(spy).toHaveBeenCalledWith('mouseenter', expect.any(Function), true);
      expect(spy).toHaveBeenCalledWith('mouseleave', expect.any(Function), true);
    });
  });

  describe('updateHoverLang', () => {
    it('does not throw when called', () => {
      expect(() => updateHoverLang('fr')).not.toThrow();
    });
  });

  describe('hover on elements', () => {
    it('does not translate LinguaFlow UI elements', () => {
      enableHover('es');

      const fabEl = document.createElement('div');
      fabEl.id = 'immersive-translate-fab';
      document.body.appendChild(fabEl);

      // Dispatch mouseenter on a FAB element
      const event = new Event('mouseenter', { bubbles: false });
      Object.defineProperty(event, 'target', { value: fabEl });
      document.dispatchEvent(event);

      // Should not add any highlight
      expect(fabEl.classList.contains('it-hover-highlight')).toBe(false);
    });

    it('does not translate already-translated elements', () => {
      enableHover('es');

      const p = document.createElement('p');
      p.textContent = 'This is a long paragraph that should be translated normally.';
      p.setAttribute('data-immersive-translated', 'true');
      document.body.appendChild(p);

      const event = new Event('mouseenter', { bubbles: false });
      Object.defineProperty(event, 'target', { value: p });
      document.dispatchEvent(event);

      expect(p.classList.contains('it-hover-highlight')).toBe(false);
    });

    it('does not translate elements with data-immersive-block', () => {
      enableHover('es');

      const div = document.createElement('div');
      div.textContent = 'Translation block content here.';
      div.setAttribute('data-immersive-block', 'true');
      document.body.appendChild(div);

      const event = new Event('mouseenter', { bubbles: false });
      Object.defineProperty(event, 'target', { value: div });
      document.dispatchEvent(event);

      expect(div.classList.contains('it-hover-highlight')).toBe(false);
    });

    it('skips elements with empty text', () => {
      enableHover('es');

      const p = document.createElement('p');
      p.textContent = '';
      document.body.appendChild(p);

      const event = new Event('mouseenter', { bubbles: false });
      Object.defineProperty(event, 'target', { value: p });
      document.dispatchEvent(event);

      expect(p.classList.contains('it-hover-highlight')).toBe(false);
    });

    it('skips elements with only punctuation and digits', () => {
      enableHover('es');

      const p = document.createElement('p');
      p.textContent = '123 --- !!!';
      document.body.appendChild(p);

      const event = new Event('mouseenter', { bubbles: false });
      Object.defineProperty(event, 'target', { value: p });
      document.dispatchEvent(event);

      expect(p.classList.contains('it-hover-highlight')).toBe(false);
    });

    it('highlights paragraphs with substantive text on hover', () => {
      enableHover('es');

      const p = document.createElement('p');
      p.textContent = 'This is a substantive paragraph with enough words to translate.';
      document.body.appendChild(p);

      const event = new Event('mouseenter', { bubbles: false });
      Object.defineProperty(event, 'target', { value: p });
      document.dispatchEvent(event);

      expect(p.classList.contains('it-hover-highlight')).toBe(true);
    });

    it('removes highlight on mouseleave before debounce fires', () => {
      enableHover('es');

      const p = document.createElement('p');
      p.textContent = 'This is a substantive paragraph with enough words to translate.';
      document.body.appendChild(p);

      // Enter
      const enterEvent = new Event('mouseenter', { bubbles: false });
      Object.defineProperty(enterEvent, 'target', { value: p });
      document.dispatchEvent(enterEvent);
      expect(p.classList.contains('it-hover-highlight')).toBe(true);

      // Leave
      const leaveEvent = new Event('mouseleave', { bubbles: false });
      Object.defineProperty(leaveEvent, 'target', { value: p });
      document.dispatchEvent(leaveEvent);
      expect(p.classList.contains('it-hover-highlight')).toBe(false);
    });
  });
});
