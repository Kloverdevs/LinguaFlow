import { TranslatableNode } from '@/types/dom';
import { shouldExcludeElement, isSubstantiveText } from './content-detector';

/**
 * Block-level tags that are themselves translatable leaf nodes.
 * These hold paragraph/heading-level text.
 */
const BLOCK_TRANSLATABLE_TAGS = new Set([
  'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'LI', 'TD', 'TH', 'BLOCKQUOTE', 'FIGCAPTION',
  'DT', 'DD', 'SUMMARY', 'CAPTION', 'LEGEND',
  'ADDRESS',
]);

/**
 * Inline tags that carry text. We translate these only when they're NOT
 * inside a block-level translatable parent (to avoid double-translating).
 */
const INLINE_TRANSLATABLE_TAGS = new Set([
  'A', 'SPAN', 'LABEL', 'EM', 'STRONG', 'B', 'I',
  'SMALL', 'MARK', 'TIME', 'CITE', 'Q', 'ABBR',
  'S', 'U', 'DEL', 'INS', 'SUB', 'SUP', 'DATA', 'OUTPUT',
]);

/**
 * Container tags that might hold direct text content not wrapped in
 * a block-level child. Common in SPAs and modern frameworks.
 */
const CONTAINER_TAGS = new Set([
  'DIV', 'SECTION', 'ARTICLE', 'MAIN', 'HEADER', 'FOOTER',
  'ASIDE', 'FIGURE', 'DETAILS', 'NAV', 'FORM',
]);

/** Tags that are block-level containers (used to detect parent coverage) */
const ALL_BLOCK_TAGS = new Set([
  ...BLOCK_TRANSLATABLE_TAGS,
  ...CONTAINER_TAGS,
]);

function getXPath(element: Element): string {
  const parts: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.documentElement) {
    let index = 1;
    let sibling = current.previousElementSibling;
    while (sibling) {
      if (sibling.tagName === current.tagName) index++;
      sibling = sibling.previousElementSibling;
    }
    parts.unshift(`${current.tagName.toLowerCase()}[${index}]`);
    current = current.parentElement;
  }

  return '/' + parts.join('/');
}

/**
 * Check if an element is visually visible.
 * Uses computed style for accuracy — handles sticky, fixed, display:contents,
 * table elements, and other cases where offsetParent is null.
 */
function isElementVisible(el: HTMLElement): boolean {
  // Fast check: hidden via inline style
  if (el.style.display === 'none' || el.style.visibility === 'hidden') return false;

  // Use getComputedStyle for accurate visibility detection
  const computed = getComputedStyle(el);
  if (computed.display === 'none' || computed.visibility === 'hidden') return false;

  // Check dimensions — but skip for elements with display:contents (they have no box)
  if (computed.display !== 'contents') {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;
  }

  return true;
}

/**
 * Get all text content from direct text nodes AND inline child elements.
 * For containers (div, section) that use inline wrappers like <span>, <em>, <strong>.
 */
function getTranslatableTextContent(el: HTMLElement): string {
  let text = '';
  for (const child of el.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      text += child.textContent || '';
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const childEl = child as HTMLElement;
      // Include text from inline elements, but not from block children
      if (!ALL_BLOCK_TAGS.has(childEl.tagName) && !CONTAINER_TAGS.has(childEl.tagName)) {
        text += childEl.textContent || '';
      }
    }
  }
  return text.trim();
}

/**
 * Check if a block-level translatable parent already covers this element's text.
 * Prevents translating a <span> when its parent <p> will also be translated.
 */
function hasTranslatableBlockAncestor(el: HTMLElement): boolean {
  let parent = el.parentElement;
  while (parent && parent !== document.body) {
    if (BLOCK_TRANSLATABLE_TAGS.has(parent.tagName)) return true;
    parent = parent.parentElement;
  }
  return false;
}

/**
 * Check if a container has block-level children that already handle the text.
 * Used for containers like DIV to avoid translating parent when children are translatable.
 */
function hasBlockTranslatableChild(el: HTMLElement): boolean {
  for (const child of el.children) {
    if (BLOCK_TRANSLATABLE_TAGS.has(child.tagName)) {
      const childText = (child as HTMLElement).textContent?.trim() || '';
      if (isSubstantiveText(childText)) return true;
    }
    // Also check for nested containers with their own block children
    if (CONTAINER_TAGS.has(child.tagName)) {
      return true; // Container child will be walked separately
    }
  }
  return false;
}

/**
 * Walk the entire document body and collect all translatable text elements.
 * Strategy:
 *  1. Block-level tags (P, H1-H6, LI, etc.) → translate if they have substantive text
 *  2. Inline tags (SPAN, A, etc.) → translate ONLY if no block ancestor covers them
 *  3. Container tags (DIV, SECTION, etc.) → translate if they have inline text content
 *     not already covered by block-level children
 */
export async function walkDOMAsync(
  root?: Element, 
  onNodesFound?: (nodes: TranslatableNode[]) => void
): Promise<TranslatableNode[]> {
  const contentRoot = root ?? document.body;
  const nodes: TranslatableNode[] = [];
  const chunk: TranslatableNode[] = [];
  const CHUNK_SIZE = 50;
  const seen = new WeakSet<HTMLElement>();

  const walker = document.createTreeWalker(
    contentRoot,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node: Node): number {
        const el = node as Element;
        if (shouldExcludeElement(el)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  let current = walker.nextNode();
  let iterations = 0;

  while (current) {
    const el = current as HTMLElement;
    
    // Yield to the main thread every 200 nodes to prevent UI freezing on massive pages
    if (++iterations % 200 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    if (
      !el.hasAttribute('data-immersive-translated') &&
      !seen.has(el) &&
      isElementVisible(el)
    ) {
      if (BLOCK_TRANSLATABLE_TAGS.has(el.tagName)) {
        // Block-level translatable: translate the full element text
        const text = el.textContent?.trim() || '';
        if (isSubstantiveText(text)) {
          seen.add(el);
          // Mark all inline children as seen too (they're covered by this block)
          markInlineChildrenSeen(el, seen);
          chunk.push({
            element: el,
            originalText: text,
            originalHTML: el.innerHTML,
            xpath: getXPath(el),
            wordCount: text.split(/\s+/).filter(Boolean).length,
          });
        }
      } else if (INLINE_TRANSLATABLE_TAGS.has(el.tagName)) {
        // Inline tags: only translate if no block-level ancestor covers them
        if (!hasTranslatableBlockAncestor(el)) {
          const text = el.textContent?.trim() || '';
          if (isSubstantiveText(text)) {
            seen.add(el);
            chunk.push({
              element: el,
              originalText: text,
              originalHTML: el.innerHTML,
              xpath: getXPath(el),
              wordCount: text.split(/\s+/).filter(Boolean).length,
            });
          }
        }
      } else if (CONTAINER_TAGS.has(el.tagName)) {
        // Containers: translate if they have inline text not covered by block children
        if (!hasBlockTranslatableChild(el)) {
          const text = getTranslatableTextContent(el);
          if (isSubstantiveText(text)) {
            seen.add(el);
            markInlineChildrenSeen(el, seen);
            chunk.push({
              element: el,
              originalText: text,
              originalHTML: el.innerHTML,
              xpath: getXPath(el),
              wordCount: text.split(/\s+/).filter(Boolean).length,
            });
          }
        }
      }
    }

    // Flush the chunk via callback if it reaches our threshold
    if (chunk.length >= CHUNK_SIZE) {
      if (onNodesFound) onNodesFound([...chunk]);
      nodes.push(...chunk);
      chunk.length = 0;
    }

    current = walker.nextNode();
  }

  // Flush any remaining nodes
  if (chunk.length > 0) {
    if (onNodesFound) onNodesFound([...chunk]);
    nodes.push(...chunk);
  }

  return nodes;
}

/**
 * Mark all inline children of a block element as "seen" so they're not
 * double-translated.
 */
function markInlineChildrenSeen(el: HTMLElement, seen: WeakSet<HTMLElement>): void {
  for (const child of el.querySelectorAll('*')) {
    if (INLINE_TRANSLATABLE_TAGS.has(child.tagName)) {
      seen.add(child as HTMLElement);
    }
  }
}
