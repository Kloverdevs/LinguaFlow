import { saveSettings, getSettings } from '@/shared/storage';
import { setTrustedHTML } from './safe-dom';

/** Duration of dismiss animation before removing overlay */
const DISMISS_ANIMATION_MS = 250;

let currentSlide = 0;
let overlay: HTMLElement | null = null;

const SLIDES = [
  {
    illustration: `
      <div class="it-ob-visual it-ob-visual-hero">
        <svg viewBox="0 0 280 140" width="280" height="140">
          <rect x="20" y="20" width="240" height="100" rx="8" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5"/>
          <rect x="36" y="36" width="120" height="8" rx="4" fill="#cbd5e1"/>
          <rect x="36" y="52" width="180" height="6" rx="3" fill="#e2e8f0"/>
          <rect x="36" y="64" width="160" height="6" rx="3" fill="#e2e8f0"/>
          <rect x="36" y="76" width="190" height="6" rx="3" fill="#e2e8f0"/>
          <rect x="36" y="92" width="100" height="8" rx="4" fill="#cbd5e1"/>
          <rect x="36" y="108" width="170" height="6" rx="3" fill="#e2e8f0"/>
          <circle cx="236" cy="96" r="16" fill="#6366f1"/>
          <text x="236" y="101" text-anchor="middle" fill="white" font-size="14" font-weight="bold" font-family="sans-serif">T</text>
        </svg>
      </div>`,
    title: 'Translate any webpage',
    desc: 'Click the floating <strong>T</strong> button in the bottom-right corner of any page to open the menu and translate.',
  },
  {
    illustration: `
      <div class="it-ob-visual it-ob-visual-demo">
        <div class="it-ob-demo-line">
          <span class="it-ob-demo-original">Bonjour le monde</span>
          <svg class="it-ob-demo-arrow" viewBox="0 0 24 24" width="20" height="20"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span class="it-ob-demo-translated">Hello world</span>
        </div>
        <div class="it-ob-demo-line">
          <span class="it-ob-demo-original">Comment allez-vous?</span>
          <svg class="it-ob-demo-arrow" viewBox="0 0 24 24" width="20" height="20"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span class="it-ob-demo-translated">How are you?</span>
        </div>
      </div>`,
    title: 'Text is replaced seamlessly',
    desc: 'Translations replace the original text in-place, matching the page\'s look and feel. Toggle <strong>Show Bilingual</strong> to see both versions.',
  },
  {
    illustration: `
      <div class="it-ob-visual it-ob-visual-engines">
        <div class="it-ob-engine-grid">
          <div class="it-ob-engine active">Google</div>
          <div class="it-ob-engine">DeepL</div>
          <div class="it-ob-engine">OpenAI</div>
          <div class="it-ob-engine">Claude</div>
        </div>
      </div>`,
    title: 'Multiple translation engines',
    desc: 'Google Translate works instantly — no setup needed. Add API keys for <strong>DeepL</strong>, <strong>OpenAI</strong>, or <strong>Claude</strong> in Settings for higher quality.',
  },
  {
    illustration: `
      <div class="it-ob-visual it-ob-visual-shortcuts">
        <div class="it-ob-key-combo">
          <kbd>Alt</kbd><span class="it-ob-plus">+</span><kbd>A</kbd>
        </div>
      </div>`,
    title: 'Keyboard shortcuts',
    desc: 'Press <strong>Alt + A</strong> to toggle translation on any page. Right-click selected text for quick translation.',
  },
];

function renderSlide(): void {
  if (!overlay) return;
  const slide = SLIDES[currentSlide];
  const isLast = currentSlide === SLIDES.length - 1;
  const isFirst = currentSlide === 0;

  const card = overlay.querySelector('.it-onboarding-card') as HTMLElement;
  if (!card) return;

  setTrustedHTML(card, `
    <div class="it-onboarding-header">
      ${slide.illustration}
    </div>
    <div class="it-onboarding-body">
      <div class="it-ob-dots">
        ${SLIDES.map((_, i) => `<span class="it-ob-dot ${i === currentSlide ? 'active' : ''}"></span>`).join('')}
      </div>
      <h3 class="it-ob-title">${slide.title}</h3>
      <p class="it-ob-desc">${slide.desc}</p>
    </div>
    <div class="it-onboarding-footer">
      <button class="it-onboarding-btn secondary" data-action="${isFirst ? 'skip' : 'prev'}">
        ${isFirst ? 'Skip' : 'Back'}
      </button>
      <button class="it-onboarding-btn primary" data-action="${isLast ? 'done' : 'next'}">
        ${isLast ? 'Get Started' : 'Next'}
      </button>
    </div>
  `);

  // Bind buttons
  card.querySelector('[data-action="skip"]')?.addEventListener('click', dismiss);
  card.querySelector('[data-action="done"]')?.addEventListener('click', dismiss);
  card.querySelector('[data-action="next"]')?.addEventListener('click', () => {
    currentSlide++;
    renderSlide();
  });
  card.querySelector('[data-action="prev"]')?.addEventListener('click', () => {
    currentSlide--;
    renderSlide();
  });
}

async function dismiss(): Promise<void> {
  if (!overlay) return;
  overlay.classList.add('it-ob-closing');
  setTimeout(async () => {
    overlay?.remove();
    overlay = null;
    currentSlide = 0;
    const current = await getSettings();
    await saveSettings({ ...current, onboardingCompleted: true });
  }, DISMISS_ANIMATION_MS);
}

export async function showOnboardingIfNeeded(): Promise<void> {
  const settings = await getSettings();
  if (settings.onboardingCompleted) return;

  currentSlide = 0;
  overlay = document.createElement('div');
  overlay.id = 'immersive-translate-onboarding';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'LinguaFlow onboarding');
  const card = document.createElement('div');
  card.className = 'it-onboarding-card';
  overlay.appendChild(card);

  document.body.appendChild(overlay);
  renderSlide();
  // Focus first button for keyboard users
  const firstBtn = card.querySelector('button') as HTMLElement;
  firstBtn?.focus();

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) dismiss();
  });
}
