import { getStrings } from '@/shared/i18n';
import { getSettings } from '@/shared/storage';

let progressContainer: HTMLElement | null = null;
let progressBar: HTMLElement | null = null;
let progressText: HTMLElement | null = null;

export async function initProgressIndicator() {
  if (progressContainer) return;

  const settings = await getSettings();
  const t = getStrings(settings.uiLocale ?? 'auto');

  progressContainer = document.createElement('div');
  progressContainer.className = 'it-progress-container';
  progressContainer.innerHTML = `
    <div class="it-progress-text">${t.translating || 'Translating...'}</div>
    <div class="it-progress-track">
      <div class="it-progress-bar"></div>
    </div>
  `;

  progressText = progressContainer.querySelector('.it-progress-text');
  progressBar = progressContainer.querySelector('.it-progress-bar');

  // Add styles via JS to avoid needing a separate CSS file for just this, or we can add it to content.css later
  const style = document.createElement('style');
  style.textContent = `
    .it-progress-container {
      position: fixed;
      top: 16px;
      left: 50%;
      transform: translateX(-50%) translateY(-100%);
      background: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 250px;
      opacity: 0;
      transition: all 0.3s ease;
      color: #333;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .it-progress-container.visible {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
    .it-progress-text {
      font-size: 14px;
      font-weight: 500;
      text-align: center;
    }
    .it-progress-track {
      height: 6px;
      background: #f0f0f0;
      border-radius: 3px;
      overflow: hidden;
    }
    .it-progress-bar {
      height: 100%;
      width: 0%;
      background: #6366f1;
      border-radius: 3px;
      transition: width 0.3s ease;
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(progressContainer);
}

export function showProgress() {
  if (progressContainer) {
    progressContainer.classList.add('visible');
    updateProgress(0, 1); // Reset
  }
}

export function hideProgress() {
  if (progressContainer) {
    progressContainer.classList.remove('visible');
    setTimeout(() => {
      if (progressBar) progressBar.style.width = '0%';
    }, 300);
  }
}

export function updateProgress(current: number, total: number) {
  if (progressContainer && progressBar && progressText) {
    const percentage = Math.max(0, Math.min(100, (current / total) * 100));
    progressBar.style.width = `${percentage}%`;
    
    // Optional: update text if we want "Translating 10 / 50..."
    // progressText.textContent = `Translating ${current} / ${total}`;
  }
}
