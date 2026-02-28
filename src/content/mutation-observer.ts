import { walkDOM } from './dom-walker';
import { TranslatableNode } from '@/types/dom';

let observer: MutationObserver | null = null;
let onNewNodesCallback: ((nodes: TranslatableNode[]) => void) | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const DEBOUNCE_MS = 500;

export function startObserving(
  callback: (nodes: TranslatableNode[]) => void
): void {
  // Disconnect any existing observer first
  stopObserving();
  onNewNodesCallback = callback;

  observer = new MutationObserver((mutations) => {
    let hasNewContent = false;

    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (
            node instanceof HTMLElement &&
            !node.hasAttribute('data-immersive-translated') &&
            !node.hasAttribute('data-immersive-block')
          ) {
            hasNewContent = true;
            break;
          }
        }
      }
      if (hasNewContent) break;
    }

    if (hasNewContent && onNewNodesCallback) {
      // Debounce: cancel previous timer and wait for DOM to settle
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const newNodes = walkDOM(document.body).filter(
          (n) => !n.element.hasAttribute('data-immersive-translated')
        );
        if (newNodes.length > 0 && onNewNodesCallback) {
          onNewNodesCallback(newNodes);
        }
      }, DEBOUNCE_MS);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

export function stopObserving(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  observer?.disconnect();
  observer = null;
  onNewNodesCallback = null;
}
