import { getStrings } from '@/shared/i18n';
import { getSettings } from '@/shared/storage';
import { setTrustedHTML } from './safe-dom';

let progressContainer: HTMLElement | null = null;
let progressBar: HTMLElement | null = null;
let progressText: HTMLElement | null = null;

export async function initProgressIndicator() {
  if (progressContainer) return;

  const settings = await getSettings();
  const t = getStrings(settings.uiLocale ?? 'auto');

  progressContainer = document.createElement('div');
  progressContainer.className = 'it-progress-container';
  progressContainer.setAttribute('role', 'status');
  progressContainer.setAttribute('aria-live', 'polite');
  const progressTextDiv = document.createElement('div');
  progressTextDiv.className = 'it-progress-text';
  progressTextDiv.textContent = t.translating || 'Translating...';
  const progressTrack = document.createElement('div');
  progressTrack.className = 'it-progress-track';
  const progressBarDiv = document.createElement('div');
  progressBarDiv.className = 'it-progress-bar';
  progressTrack.appendChild(progressBarDiv);
  progressContainer.appendChild(progressTextDiv);
  progressContainer.appendChild(progressTrack);

  progressText = progressContainer.querySelector('.it-progress-text');
  progressBar = progressContainer.querySelector('.it-progress-bar');

  // Add styles via JS — guard against duplicates if re-initialized
  if (document.getElementById('it-progress-styles')) {
    document.body.appendChild(progressContainer);
    return;
  }
  const style = document.createElement('style');
  style.id = 'it-progress-styles';
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
    .it-progress-error {
      background-color: #fef2f2 !important;
      color: #b91c1c !important;
      border: 1px solid #f87171;
    }
    .it-progress-error .it-progress-bar {
      background: #ef4444 !important;
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(progressContainer);
}

let globalTotal = 0;
let globalCurrent = 0;

export function showProgress(initialTotal = 0) {
  if (progressContainer) {
    progressContainer.classList.remove('it-progress-error');
    progressContainer.classList.add('visible');
    globalTotal = initialTotal;
    globalCurrent = 0;
    
    // Reset text to default based on current language
    getSettings().then(settings => {
      const t = getStrings(settings.uiLocale ?? 'auto');
      if (progressText) progressText.textContent = t.translating || 'Translating...';
    });

    updateProgressUI();
  }
}

export function hideProgress() {
  if (progressContainer) {
    progressContainer.classList.remove('visible');
    setTimeout(() => {
      if (progressBar) progressBar.style.width = '0%';
      progressContainer?.classList.remove('it-progress-error');
    }, 300);
  }
}

export function setTotalNodes(total: number) {
  globalTotal = total;
  updateProgressUI();
}

export function incrementProgress(amount: number) {
  globalCurrent += amount;
  updateProgressUI();
}

function updateProgressUI() {
  if (progressContainer && progressBar && progressText) {
    const percentage = globalTotal > 0 ? Math.max(0, Math.min(100, (globalCurrent / globalTotal) * 100)) : 0;
    progressBar.style.width = `${percentage}%`;

    // Auto-hide when 100% complete
    if (globalTotal > 0 && globalCurrent >= globalTotal) {
      setTimeout(() => {
        // Double check it wasn't reset by a new translation batch before hiding
        if (globalTotal > 0 && globalCurrent >= globalTotal) {
          hideProgress();
        }
      }, 800);
    }
  }
}

export function showErrorProgress(message: string) {
  if (progressContainer && progressText) {
    progressContainer.classList.add('visible', 'it-progress-error');
    progressText.textContent = message;
    if (progressBar) progressBar.style.width = '100%';
    
    // Auto-hide error after 5 seconds
    setTimeout(() => {
      hideProgress();
    }, 5000);
  }
}
