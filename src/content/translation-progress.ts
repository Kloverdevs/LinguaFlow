import { getStrings } from '@/shared/i18n';
import { getSettings } from '@/shared/storage';
import { setTrustedHTML } from './safe-dom';

/** Delay before resetting progress bar after hide animation */
const HIDE_RESET_MS = 300;
/** Delay before auto-hiding when translation reaches 100% */
const AUTO_HIDE_DELAY_MS = 800;
/** Delay before auto-hiding error messages */
const ERROR_DISPLAY_MS = 5000;

let progressContainer: HTMLElement | null = null;
let progressBar: HTMLElement | null = null;
let progressText: HTMLElement | null = null;
let progressPercent: HTMLElement | null = null;
let cancelCallback: (() => void) | null = null;

export function setProgressCancelCallback(cb: (() => void) | null): void {
  cancelCallback = cb;
}

export async function initProgressIndicator() {
  if (progressContainer) return;

  const settings = await getSettings();
  const t = getStrings(settings.uiLocale ?? 'auto');

  progressContainer = document.createElement('div');
  progressContainer.className = 'it-progress-container';
  progressContainer.setAttribute('role', 'status');
  progressContainer.setAttribute('aria-live', 'polite');

  const progressRow = document.createElement('div');
  progressRow.className = 'it-progress-row';

  const progressTextDiv = document.createElement('div');
  progressTextDiv.className = 'it-progress-text';
  progressTextDiv.textContent = t.translating || 'Translating...';

  const progressPercentDiv = document.createElement('div');
  progressPercentDiv.className = 'it-progress-percent';
  progressPercentDiv.textContent = '0%';

  progressRow.appendChild(progressTextDiv);
  progressRow.appendChild(progressPercentDiv);

  const progressTrack = document.createElement('div');
  progressTrack.className = 'it-progress-track';
  const progressBarDiv = document.createElement('div');
  progressBarDiv.className = 'it-progress-bar';
  progressTrack.appendChild(progressBarDiv);

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'it-progress-cancel';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.setAttribute('aria-label', 'Cancel translation');
  cancelBtn.addEventListener('click', () => {
    if (cancelCallback) cancelCallback();
    hideProgress();
  });

  progressContainer.appendChild(progressRow);
  progressContainer.appendChild(progressTrack);
  progressContainer.appendChild(cancelBtn);

  progressText = progressTextDiv;
  progressBar = progressBarDiv;
  progressPercent = progressPercentDiv;

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
    .it-progress-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .it-progress-text {
      font-size: 14px;
      font-weight: 500;
    }
    .it-progress-percent {
      font-size: 13px;
      font-weight: 600;
      color: #6366f1;
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
    .it-progress-cancel {
      align-self: center;
      margin-top: 4px;
      padding: 4px 14px;
      font-size: 12px;
      font-weight: 500;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: #fff;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.15s;
      font-family: inherit;
    }
    .it-progress-cancel:hover {
      background: #f3f4f6;
      color: #374151;
      border-color: #9ca3af;
    }
    .it-progress-error {
      background-color: #fef2f2 !important;
      color: #b91c1c !important;
      border: 1px solid #f87171;
    }
    .it-progress-error .it-progress-bar {
      background: #ef4444 !important;
    }
    @media (prefers-color-scheme: dark) {
      .it-progress-container {
        background: #1e293b;
        color: #e2e8f0;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      }
      .it-progress-track {
        background: #334155;
      }
      .it-progress-cancel {
        background: #334155;
        color: #94a3b8;
        border-color: #475569;
      }
      .it-progress-cancel:hover {
        background: #475569;
        color: #e2e8f0;
        border-color: #64748b;
      }
      .it-progress-error {
        background-color: #450a0a !important;
        color: #fca5a5 !important;
        border-color: #991b1b;
      }
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
    }, HIDE_RESET_MS);
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
    if (progressPercent) {
      progressPercent.textContent = `${Math.round(percentage)}%`;
    }

    // Auto-hide when 100% complete
    if (globalTotal > 0 && globalCurrent >= globalTotal) {
      setTimeout(() => {
        // Double check it wasn't reset by a new translation batch before hiding
        if (globalTotal > 0 && globalCurrent >= globalTotal) {
          hideProgress();
        }
      }, AUTO_HIDE_DELAY_MS);
    }
  }
}

export function showErrorProgress(message: string) {
  if (progressContainer && progressText) {
    progressContainer.classList.add('visible', 'it-progress-error');
    progressText.textContent = message;
    if (progressBar) progressBar.style.width = '100%';

    // Auto-hide error after ERROR_DISPLAY_MS
    setTimeout(() => {
      hideProgress();
    }, ERROR_DISPLAY_MS);
  }
}
