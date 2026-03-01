import { DisplayMode } from '@/types/settings';
import { isPdfPage } from './pdf-handler';

let fab: HTMLElement | null = null;
let fabMenu: HTMLElement | null = null;
let isMenuOpen = false;
let currentFabSize = 48;

// Drag state
let isDragging = false;
let wasDragged = false;
let dragStartX = 0;
let dragStartY = 0;
let fabStartX = 0;
let fabStartY = 0;
const DRAG_THRESHOLD = 5;

type FabCallbacks = {
  onTranslatePage: () => void;
  onRemoveTranslations: () => void;
  onToggleHover: (enabled: boolean) => void;
  onToggleMode: () => void;
  onReaderMode: () => void;
  isActive: () => boolean;
  isHoverEnabled: () => boolean;
  getDisplayMode: () => DisplayMode;
};

export type FabLabels = {
  translatePage: string;
  restoreOriginal: string;
  bilingualMode: string;
  hoverTranslate: string;
  readerMode: string;
};

let callbacks: FabCallbacks;

export function createFloatingButton(cbs: FabCallbacks, labels: FabLabels, size = 48): void {
  callbacks = cbs;
  currentFabSize = size;

  fab = document.createElement('div');
  fab.id = 'immersive-translate-fab';
  applyFabSize(size);
  fab.innerHTML = `<svg viewBox="0 0 24 24" width="${Math.round(size * 0.46)}" height="${Math.round(size * 0.46)}">
    <path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04z"/>
    <path d="M18.5 10l-4.5 12h2l1.12-3h4.75L23 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
  </svg>`;

  // Use mousedown/up for drag + click detection
  fab.addEventListener('mousedown', handleFabMouseDown);
  fab.addEventListener('click', handleFabClick);

  fabMenu = document.createElement('div');
  fabMenu.id = 'immersive-translate-fab-menu';
  buildMenuHTML(labels);

  fabMenu.querySelectorAll('.immersive-fab-menu-item').forEach((btn) => {
    btn.addEventListener('click', handleMenuAction);
  });

  document.body.appendChild(fabMenu);
  document.body.appendChild(fab);

  document.addEventListener('click', (e) => {
    if (isMenuOpen && fab && fabMenu && !fab.contains(e.target as Node) && !fabMenu.contains(e.target as Node)) {
      closeMenu();
    }
  });
}

function buildMenuHTML(labels: FabLabels): void {
  if (!fabMenu) return;
  fabMenu.innerHTML = `
    <div class="immersive-fab-menu-header">LinguaFlow</div>
    <button class="immersive-fab-menu-item" data-action="translate">
      <span class="immersive-fab-menu-icon">&#9654;</span>
      <span>${labels.translatePage}</span>
    </button>
    <button class="immersive-fab-menu-item" data-action="remove">
      <span class="immersive-fab-menu-icon">&#10005;</span>
      <span>${labels.restoreOriginal}</span>
    </button>
    ${!isPdfPage() ? `
    <div class="immersive-fab-menu-divider"></div>
    <button class="immersive-fab-menu-item" data-action="mode">
      <span class="immersive-fab-menu-icon">&#8644;</span>
      <span>${labels.bilingualMode}</span>
      <span class="immersive-fab-menu-badge">OFF</span>
    </button>
    <button class="immersive-fab-menu-item" data-action="hover">
      <span class="immersive-fab-menu-icon">&#9786;</span>
      <span>${labels.hoverTranslate}</span>
      <span class="immersive-fab-menu-badge">OFF</span>
    </button>
    <div class="immersive-fab-menu-divider"></div>
    <button class="immersive-fab-menu-item" data-action="reader">
      <span class="immersive-fab-menu-icon">&#128214;</span>
      <span>${labels.readerMode}</span>
    </button>
    ` : ''}
  `;
  // Re-bind click handlers
  fabMenu.querySelectorAll('.immersive-fab-menu-item').forEach((btn) => {
    btn.addEventListener('click', handleMenuAction);
  });
}

function applyFabSize(size: number): void {
  if (!fab) return;
  currentFabSize = size;
  fab.style.width = `${size}px`;
  fab.style.height = `${size}px`;
  fab.style.borderRadius = `${Math.round(size * 0.29)}px`;

  const svg = fab.querySelector('svg');
  if (svg) {
    const iconSize = Math.round(size * 0.46);
    svg.setAttribute('width', String(iconSize));
    svg.setAttribute('height', String(iconSize));
  }
}

/** Update menu labels (for language changes) */
export function updateFabLabels(labels: FabLabels): void {
  buildMenuHTML(labels);
  updateMenuState();
}

/** Update FAB size */
export function updateFabSize(size: number): void {
  applyFabSize(size);
}

/** Show/hide the FAB */
export function setFabVisible(visible: boolean): void {
  if (fab) fab.style.display = visible ? '' : 'none';
  if (!visible && isMenuOpen) closeMenu();
}

/* ─── Drag Logic ─── */
function handleFabMouseDown(e: MouseEvent): void {
  if (!fab) return;
  e.preventDefault();

  isDragging = false;
  wasDragged = false;
  dragStartX = e.clientX;
  dragStartY = e.clientY;

  const rect = fab.getBoundingClientRect();
  fabStartX = rect.left;
  fabStartY = rect.top;

  document.addEventListener('mousemove', handleFabMouseMove);
  document.addEventListener('mouseup', handleFabMouseUp);
}

function handleFabMouseMove(e: MouseEvent): void {
  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;

  if (!isDragging && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
    isDragging = true;
    wasDragged = true;
    if (fab) {
      fab.style.transition = 'none';
      fab.style.cursor = 'grabbing';
    }
    // Close menu if open during drag
    if (isMenuOpen) closeMenu();
  }

  if (isDragging && fab) {
    const newX = Math.max(0, Math.min(window.innerWidth - currentFabSize, fabStartX + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - currentFabSize, fabStartY + dy));

    // Switch from bottom/right to top/left positioning for drag
    fab.style.right = 'auto';
    fab.style.bottom = 'auto';
    fab.style.left = `${newX}px`;
    fab.style.top = `${newY}px`;
  }
}

function handleFabMouseUp(): void {
  document.removeEventListener('mousemove', handleFabMouseMove);
  document.removeEventListener('mouseup', handleFabMouseUp);

  isDragging = false;
  if (fab) {
    fab.style.transition = '';
    fab.style.cursor = '';
  }

  // Update menu position to follow FAB
  updateMenuPosition();
}

function handleFabClick(e: Event): void {
  // If we just finished dragging, don't open menu
  if (wasDragged) {
    wasDragged = false;
    e.stopPropagation();
    return;
  }
  toggleMenu();
}

function updateMenuPosition(): void {
  if (!fab || !fabMenu) return;
  const rect = fab.getBoundingClientRect();
  const fabCenterX = rect.left + rect.width / 2;
  const isOnRight = fabCenterX > window.innerWidth / 2;

  // Position menu above the FAB
  fabMenu.style.bottom = 'auto';
  fabMenu.style.right = 'auto';
  fabMenu.style.top = `${Math.max(8, rect.top - fabMenu.offsetHeight - 10)}px`;

  if (isOnRight) {
    fabMenu.style.left = 'auto';
    fabMenu.style.right = `${window.innerWidth - rect.right}px`;
  } else {
    fabMenu.style.left = `${rect.left}px`;
    fabMenu.style.right = 'auto';
  }
}

/* ─── Menu Logic ─── */
function toggleMenu(): void {
  isMenuOpen ? closeMenu() : openMenu();
}

function openMenu(): void {
  if (!fabMenu || !fab) return;
  isMenuOpen = true;
  fabMenu.classList.add('open');
  fab.classList.add('active');
  updateMenuState();
  updateMenuPosition();
}

function closeMenu(): void {
  if (!fabMenu || !fab) return;
  isMenuOpen = false;
  fabMenu.classList.remove('open');
  fab.classList.remove('active');
}

function updateMenuState(): void {
  if (!fabMenu) return;
  const active = callbacks.isActive();

  const translateBtn = fabMenu.querySelector('[data-action="translate"]') as HTMLElement;
  const removeBtn = fabMenu.querySelector('[data-action="remove"]') as HTMLElement;
  const modeBadge = fabMenu.querySelector('[data-action="mode"] .immersive-fab-menu-badge') as HTMLElement;
  const hoverBadge = fabMenu.querySelector('[data-action="hover"] .immersive-fab-menu-badge') as HTMLElement;

  if (translateBtn) translateBtn.style.display = active ? 'none' : '';
  if (removeBtn) removeBtn.style.display = active ? '' : 'none';

  if (modeBadge) {
    const isBilingual = callbacks.getDisplayMode() === 'bilingual';
    modeBadge.textContent = isBilingual ? 'ON' : 'OFF';
    modeBadge.classList.toggle('on', isBilingual);
  }

  if (hoverBadge) {
    const hoverOn = callbacks.isHoverEnabled();
    hoverBadge.textContent = hoverOn ? 'ON' : 'OFF';
    hoverBadge.classList.toggle('on', hoverOn);
  }
}

function handleMenuAction(e: Event): void {
  const action = (e.currentTarget as HTMLElement).dataset.action;

  switch (action) {
    case 'translate':
      callbacks.onTranslatePage();
      break;
    case 'remove':
      callbacks.onRemoveTranslations();
      break;
    case 'mode':
      callbacks.onToggleMode();
      updateMenuState();
      return; // Don't close menu
    case 'hover':
      callbacks.onToggleHover(!callbacks.isHoverEnabled());
      updateMenuState();
      return; // Don't close menu
    case 'reader':
      callbacks.onReaderMode();
      break;
  }

  closeMenu();
}

export function updateFabState(): void {
  if (!fab) return;
  fab.classList.toggle('translating', callbacks.isActive());
  // Remove progress when state changes
  const badge = fab.querySelector('.it-fab-progress');
  if (badge) badge.remove();
}

export function updateFabProgress(current: number, total: number): void {
  if (!fab) return;
  let badge = fab.querySelector('.it-fab-progress') as HTMLElement;
  if (!badge) {
    badge = document.createElement('span');
    badge.className = 'it-fab-progress';
    fab.appendChild(badge);
  }
  badge.textContent = `${current}/${total}`;
}

export function destroyFloatingButton(): void {
  fab?.remove();
  fabMenu?.remove();
  fab = null;
  fabMenu = null;
  isMenuOpen = false;
}
