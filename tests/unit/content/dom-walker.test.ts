import { describe, it, expect, beforeEach, vi } from 'vitest';
import { walkDOM } from '@/content/dom-walker';

// Mock getComputedStyle for jsdom
function mockVisible(el: Element): void {
  Object.defineProperty(el, 'offsetParent', { value: document.body, configurable: true });
  Object.defineProperty(el, 'getBoundingClientRect', {
    value: () => ({ width: 100, height: 20, top: 0, left: 0, bottom: 20, right: 100 }),
    configurable: true,
  });
}

function mockVisibleAll(container: Element): void {
  container.querySelectorAll('*').forEach(mockVisible);
}

// Mock getComputedStyle globally for visibility checks
vi.stubGlobal('getComputedStyle', (el: Element) => ({
  display: (el as HTMLElement).style.display || 'block',
  visibility: (el as HTMLElement).style.visibility || 'visible',
}));

describe('walkDOM', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('finds paragraph elements with text', () => {
    document.body.innerHTML = '<p>Hello world, this is a test paragraph</p>';
    mockVisibleAll(document.body);

    const nodes = walkDOM();
    expect(nodes.length).toBe(1);
    expect(nodes[0].originalText).toBe('Hello world, this is a test paragraph');
  });

  it('finds heading elements', () => {
    document.body.innerHTML = '<h1>Main Heading Title</h1><h2>Sub Heading Title</h2>';
    mockVisibleAll(document.body);

    const nodes = walkDOM();
    expect(nodes.length).toBe(2);
  });

  it('skips script and style elements', () => {
    document.body.innerHTML = `
      <p>Visible paragraph text here</p>
      <script>console.log("hidden")</script>
      <style>.foo { color: red }</style>
    `;
    mockVisibleAll(document.body);

    const nodes = walkDOM();
    expect(nodes.length).toBe(1);
    expect(nodes[0].originalText).toBe('Visible paragraph text here');
  });

  it('skips already translated elements', () => {
    document.body.innerHTML = '<p data-immersive-translated="true">Already done</p>';
    mockVisibleAll(document.body);

    const nodes = walkDOM();
    expect(nodes.length).toBe(0);
  });

  it('skips short text content', () => {
    document.body.innerHTML = '<p>A</p>';
    mockVisibleAll(document.body);

    const nodes = walkDOM();
    expect(nodes.length).toBe(0);
  });

  it('includes word count in results', () => {
    document.body.innerHTML = '<p>This is a test sentence with multiple words</p>';
    mockVisibleAll(document.body);

    const nodes = walkDOM();
    expect(nodes.length).toBe(1);
    expect(nodes[0].wordCount).toBe(8);
  });

  it('includes xpath in results', () => {
    document.body.innerHTML = '<div><p>Test paragraph content here</p></div>';
    mockVisibleAll(document.body);

    const nodes = walkDOM();
    expect(nodes.length).toBe(1);
    expect(nodes[0].xpath).toContain('p[1]');
  });

  it('accepts a custom root element', () => {
    document.body.innerHTML = `
      <div id="outside"><p>Outside paragraph text here</p></div>
      <div id="inside"><p>Inside paragraph text here</p></div>
    `;
    mockVisibleAll(document.body);

    const inside = document.getElementById('inside')!;
    const nodes = walkDOM(inside);
    expect(nodes.length).toBe(1);
    expect(nodes[0].originalText).toBe('Inside paragraph text here');
  });

  it('skips input and button elements', () => {
    document.body.innerHTML = `
      <p>Real paragraph content here</p>
      <input value="input text" />
      <button>Click me please</button>
    `;
    mockVisibleAll(document.body);

    const nodes = walkDOM();
    expect(nodes.length).toBe(1);
  });

  // New tests for audit fixes:

  it('translates block-level P element with inline children (span, em, strong)', () => {
    document.body.innerHTML = '<p>Hello <span>beautiful</span> <em>world</em></p>';
    mockVisibleAll(document.body);

    const nodes = walkDOM();
    // The P should be translated as a whole, inline children should NOT be separate
    expect(nodes.length).toBe(1);
    expect(nodes[0].element.tagName).toBe('P');
    expect(nodes[0].originalText).toBe('Hello beautiful world');
  });

  it('does not double-translate inline children of a block parent', () => {
    document.body.innerHTML = '<p>Click <a href="/page">here</a> for more info</p>';
    mockVisibleAll(document.body);

    const nodes = walkDOM();
    // P covers the text — A should not get its own entry
    expect(nodes.length).toBe(1);
    expect(nodes[0].element.tagName).toBe('P');
  });

  it('translates standalone inline elements with no block parent', () => {
    document.body.innerHTML = '<div><span>Standalone inline text here</span></div>';
    mockVisibleAll(document.body);

    const nodes = walkDOM();
    // The span has no block translatable ancestor — it gets picked up
    // (DIV is a container, not a block translatable)
    expect(nodes.length).toBeGreaterThanOrEqual(1);
  });

  it('translates container DIV with only inline text content', () => {
    document.body.innerHTML = '<div>This is plain text inside a div element</div>';
    mockVisibleAll(document.body);

    const nodes = walkDOM();
    expect(nodes.length).toBe(1);
    expect(nodes[0].element.tagName).toBe('DIV');
  });

  it('skips container DIV that has block children covering text', () => {
    document.body.innerHTML = '<div><p>Paragraph handles this text completely</p></div>';
    mockVisibleAll(document.body);

    const nodes = walkDOM();
    // The P is picked up, the DIV is not (it has a block translatable child)
    expect(nodes.length).toBe(1);
    expect(nodes[0].element.tagName).toBe('P');
  });

  it('finds SUMMARY and LEGEND elements', () => {
    document.body.innerHTML = `
      <details>
        <summary>Click to expand this details element</summary>
        <p>Detail content text goes here</p>
      </details>
      <fieldset>
        <legend>Form Field Group Legend Text</legend>
      </fieldset>
    `;
    mockVisibleAll(document.body);

    const nodes = walkDOM();
    const tags = nodes.map(n => n.element.tagName);
    expect(tags).toContain('SUMMARY');
    expect(tags).toContain('LEGEND');
  });

  it('finds ADDRESS elements', () => {
    document.body.innerHTML = '<address>123 Main Street, Springfield</address>';
    mockVisibleAll(document.body);

    const nodes = walkDOM();
    expect(nodes.length).toBe(1);
    expect(nodes[0].element.tagName).toBe('ADDRESS');
  });

  it('handles container with mixed inline elements (span, strong)', () => {
    document.body.innerHTML = '<div><span>Part one</span> and <strong>part two</strong></div>';
    mockVisibleAll(document.body);

    const nodes = walkDOM();
    // The DIV has no block children — its inline text should be collected
    expect(nodes.length).toBeGreaterThanOrEqual(1);
  });

  it('handles NAV content when nav has text elements', () => {
    document.body.innerHTML = '<nav><a href="/">Home Page Link Text</a></nav>';
    mockVisibleAll(document.body);

    const nodes = walkDOM();
    // NAV is no longer excluded — the A inside should be translatable
    expect(nodes.length).toBeGreaterThanOrEqual(1);
  });
});
