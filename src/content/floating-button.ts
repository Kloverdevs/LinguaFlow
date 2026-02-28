import { DisplayMode } from '@/types/settings';

let fab: HTMLElement | null = null;
let fabMenu: HTMLElement | null = null;
let isMenuOpen = false;

type FabCallbacks = {
  onTranslatePage: () => void;
  onRemoveTranslations: () => void;
  onToggleHover: (enabled: boolean) => void;
  onToggleMode: () => void;
  isActive: () => boolean;
  isHoverEnabled: () => boolean;
  getDisplayMode: () => DisplayMode;
};

let callbacks: FabCallbacks;

export function createFloatingButton(cbs: FabCallbacks): void {
  callbacks = cbs;

  fab = document.createElement('div');
  fab.id = 'immersive-translate-fab';
  fab.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24">
    <path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04z"/>
    <path d="M18.5 10l-4.5 12h2l1.12-3h4.75L23 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
  </svg>`;
  fab.addEventListener('click', toggleMenu);

  fabMenu = document.createElement('div');
  fabMenu.id = 'immersive-translate-fab-menu';
  fabMenu.innerHTML = `
    <div class="immersive-fab-menu-header">LinguaFlow</div>
    <button class="immersive-fab-menu-item" data-action="translate">
      <span class="immersive-fab-menu-icon">&#9654;</span>
      <span>Translate Page</span>
    </button>
    <button class="immersive-fab-menu-item" data-action="remove">
      <span class="immersive-fab-menu-icon">&#10005;</span>
      <span>Restore Original</span>
    </button>
    <div class="immersive-fab-menu-divider"></div>
    <button class="immersive-fab-menu-item" data-action="mode">
      <span class="immersive-fab-menu-icon">&#8644;</span>
      <span>Show Bilingual</span>
      <span class="immersive-fab-menu-badge">OFF</span>
    </button>
    <button class="immersive-fab-menu-item" data-action="hover">
      <span class="immersive-fab-menu-icon">&#9786;</span>
      <span>Hover Translate</span>
      <span class="immersive-fab-menu-badge">OFF</span>
    </button>
  `;

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

function toggleMenu(): void {
  isMenuOpen ? closeMenu() : openMenu();
}

function openMenu(): void {
  if (!fabMenu || !fab) return;
  isMenuOpen = true;
  fabMenu.classList.add('open');
  fab.classList.add('active');
  updateMenuState();
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
  }

  closeMenu();
}

export function updateFabState(): void {
  if (!fab) return;
  fab.classList.toggle('translating', callbacks.isActive());
}

export function destroyFloatingButton(): void {
  fab?.remove();
  fabMenu?.remove();
  fab = null;
  fabMenu = null;
  isMenuOpen = false;
}
