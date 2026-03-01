import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { startObserving, stopObserving } from '@/content/mutation-observer';

// Mock dom walker to simply return arbitrary nodes for our spy to see
vi.mock('@/content/dom-walker', () => ({
  walkDOMAsync: vi.fn(async (container: Element) => {
    // Generate a set of fake nodes
    const found = container.querySelectorAll('.translatable');
    return Array.from(found).map(el => ({
      element: el,
      originalText: el.textContent,
      originalHTML: el.innerHTML,
      xpath: 'mock',
      wordCount: 1
    }));
  })
}));

describe('MutationObserver (SPA Edge Cases)', () => {
  let callbackSpy = vi.fn();

  beforeEach(() => {
    document.body.innerHTML = '';
    vi.useFakeTimers();
    callbackSpy.mockClear();
  });

  afterEach(() => {
    stopObserving();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('debounces multiple rapid mutations into a single callback evaluation', async () => {
    startObserving(callbackSpy);

    // Simulate React re-rendering a feed 3 times quickly
    const div1 = document.createElement('div');
    div1.className = 'translatable';
    div1.textContent = 'A';
    document.body.appendChild(div1);

    const div2 = document.createElement('div');
    div2.className = 'translatable';
    div2.textContent = 'B';
    document.body.appendChild(div2);

    const div3 = document.createElement('div');
    div3.className = 'translatable';
    div3.textContent = 'C';
    document.body.appendChild(div3);

    // Initial timeout logic (debounced 500ms)
    vi.advanceTimersByTime(200);
    expect(callbackSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(350); 

    // Wait for the async walkDOMAsync microtasks
    await vi.runAllTimersAsync();

    expect(callbackSpy).toHaveBeenCalledTimes(1);
    
    // The spy should have received the array of ALL added nodes since they all share the class
    const calls = callbackSpy.mock.calls[0][0];
    expect(calls.length).toBe(3);
  });

  it('cleans up observer and drops timeout on stopObserving', () => {
    startObserving(callbackSpy);

    const div = document.createElement('div');
    div.className = 'translatable';
    document.body.appendChild(div);

    // Stop before timer resolves
    stopObserving();
    vi.runAllTimers();

    expect(callbackSpy).not.toHaveBeenCalled();
  });

  it('ignores nodes that already possess data-immersive-translated tag during observation', async () => {
    startObserving(callbackSpy);

    const translatedDiv = document.createElement('div');
    translatedDiv.className = 'translatable';
    translatedDiv.setAttribute('data-immersive-translated', 'true');
    translatedDiv.textContent = 'Already translated';
    
    document.body.appendChild(translatedDiv);

    await vi.runAllTimersAsync();
    
    expect(callbackSpy).not.toHaveBeenCalled();
  });
});
