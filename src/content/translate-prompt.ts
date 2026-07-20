import { sendToBackground } from '@/shared/message-bus';
import { resolveLocale } from '@/shared/i18n';
import { getLanguageName } from '@/constants/languages';
import { UserSettings } from '@/types/settings';
import { logger } from '@/shared/logger';
import { setTrustedHTML } from './safe-dom';

const PROMPT_ID = 'immersive-translate-prompt';
const DISMISS_KEY = 'lf-translate-prompt-dismissed';
/** Minimum amount of sampled visible text before attempting language detection */
const MIN_SAMPLE_LENGTH = 120;
/** Number of characters sampled from the page for language detection */
const SAMPLE_LENGTH = 800;

export interface PromptStrings {
  message: string; // supports {lang} placeholder
  translate: string;
  always: string;
  dismiss: string;
}

const PROMPT_STRINGS: Record<string, PromptStrings> = {
  en: { message: 'This page appears to be in {lang}. Translate it?', translate: 'Translate', always: 'Always', dismiss: 'Dismiss' },
  es: { message: 'Esta página parece estar en {lang}. ¿Traducirla?', translate: 'Traducir', always: 'Siempre', dismiss: 'Descartar' },
  fr: { message: 'Cette page semble être en {lang}. La traduire ?', translate: 'Traduire', always: 'Toujours', dismiss: 'Ignorer' },
  de: { message: 'Diese Seite scheint auf {lang} zu sein. Übersetzen?', translate: 'Übersetzen', always: 'Immer', dismiss: 'Schließen' },
  pt: { message: 'Esta página parece estar em {lang}. Traduzir?', translate: 'Traduzir', always: 'Sempre', dismiss: 'Dispensar' },
  it: { message: 'Questa pagina sembra essere in {lang}. Tradurla?', translate: 'Traduci', always: 'Sempre', dismiss: 'Ignora' },
  ru: { message: 'Похоже, эта страница на языке {lang}. Перевести?', translate: 'Перевести', always: 'Всегда', dismiss: 'Закрыть' },
  zh: { message: '此页面似乎是{lang}。要翻译吗？', translate: '翻译', always: '始终', dismiss: '关闭' },
  ja: { message: 'このページは{lang}のようです。翻訳しますか？', translate: '翻訳', always: '常に', dismiss: '閉じる' },
  ko: { message: '이 페이지는 {lang}인 것 같습니다. 번역할까요?', translate: '번역', always: '항상', dismiss: '닫기' },
  ar: { message: 'يبدو أن هذه الصفحة باللغة {lang}. هل تريد ترجمتها؟', translate: 'ترجمة', always: 'دائمًا', dismiss: 'تجاهل' },
};

function getPromptStrings(uiLocale: UserSettings['uiLocale']): PromptStrings {
  const resolved = resolveLocale(uiLocale);
  return PROMPT_STRINGS[resolved] ?? PROMPT_STRINGS.en;
}

/** Normalize a BCP-47 / ISO language code down to its base language subtag. */
export function baseLang(code: string | null | undefined): string {
  if (!code) return '';
  return code.split(/[-_]/)[0].toLowerCase();
}

export interface PromptDecisionInput {
  detectedLang: string | null;
  targetLang: string;
  hostname: string;
  autoSites: string[];
  neverSites: string[];
  dismissedHosts: string[];
  autoDetectPrompt?: boolean;
}

/**
 * Decide whether the "translate this page" prompt should be shown.
 * Pure function — no DOM access — so it can be unit tested in isolation.
 */
export function shouldPromptTranslate(input: PromptDecisionInput): boolean {
  if (input.autoDetectPrompt === false) return false;

  const detected = baseLang(input.detectedLang);
  if (!detected) return false;

  const target = baseLang(input.targetLang);
  if (!target || detected === target) return false;

  if (input.autoSites.includes(input.hostname)) return false;
  if (input.neverSites.includes(input.hostname)) return false;
  if (input.dismissedHosts.includes(input.hostname)) return false;

  return true;
}

function getDismissedHosts(): string[] {
  try {
    const raw = sessionStorage.getItem(DISMISS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function addDismissedHost(host: string): void {
  try {
    const hosts = getDismissedHosts();
    if (!hosts.includes(host)) {
      hosts.push(host);
      sessionStorage.setItem(DISMISS_KEY, JSON.stringify(hosts));
    }
  } catch {
    // sessionStorage may be unavailable (e.g. sandboxed frames) — non-fatal
  }
}

function samplePageText(): string {
  const text = document.body?.innerText || '';
  return text.replace(/\s+/g, ' ').trim().slice(0, SAMPLE_LENGTH);
}

export function removeTranslatePrompt(): void {
  document.getElementById(PROMPT_ID)?.remove();
}

export interface TranslatePromptCallbacks {
  onTranslate: () => void;
  onAlways: () => void;
}

function renderBar(detectedLang: string, settings: UserSettings, host: string, cbs: TranslatePromptCallbacks): void {
  removeTranslatePrompt();

  const s = getPromptStrings(settings.uiLocale);
  const langName = getLanguageName(baseLang(detectedLang)) || detectedLang.toUpperCase();

  const bar = document.createElement('div');
  bar.id = PROMPT_ID;
  bar.setAttribute('role', 'dialog');
  bar.setAttribute('aria-live', 'polite');
  bar.setAttribute('aria-label', s.message.replace('{lang}', langName));

  const message = document.createElement('span');
  message.className = 'it-prompt-message';
  setTrustedHTML(
    message,
    `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04z"/></svg>`
  );
  message.appendChild(document.createTextNode(s.message.replace('{lang}', langName)));

  const translateBtn = document.createElement('button');
  translateBtn.className = 'it-prompt-btn it-prompt-primary';
  translateBtn.textContent = s.translate;
  translateBtn.addEventListener('click', () => {
    removeTranslatePrompt();
    cbs.onTranslate();
  });

  const alwaysBtn = document.createElement('button');
  alwaysBtn.className = 'it-prompt-btn';
  alwaysBtn.textContent = s.always;
  alwaysBtn.addEventListener('click', () => {
    removeTranslatePrompt();
    cbs.onAlways();
  });

  const closeBtn = document.createElement('button');
  closeBtn.className = 'it-prompt-close';
  closeBtn.setAttribute('aria-label', s.dismiss);
  closeBtn.title = s.dismiss;
  closeBtn.textContent = '\u2715';
  closeBtn.addEventListener('click', () => {
    addDismissedHost(host);
    removeTranslatePrompt();
  });

  bar.appendChild(message);
  bar.appendChild(translateBtn);
  bar.appendChild(alwaysBtn);
  bar.appendChild(closeBtn);
  document.body.appendChild(bar);

  translateBtn.focus();
}

/**
 * Sample the page, detect its language, and — if it differs from the user's
 * target language and the site has no existing rule — show a translate prompt.
 * Runs only in the top frame and is a no-op when the feature is disabled.
 */
export async function maybeShowTranslatePrompt(settings: UserSettings, cbs: TranslatePromptCallbacks): Promise<void> {
  if (window.top !== window.self) return;
  if (settings.autoDetectPrompt === false) return;

  const host = window.location.hostname;
  const autoSites = settings.autoTranslateSites ?? [];
  const neverSites = settings.neverTranslateSites ?? [];
  const dismissedHosts = getDismissedHosts();

  // Cheap pre-check before paying for network language detection
  if (autoSites.includes(host) || neverSites.includes(host) || dismissedHosts.includes(host)) return;

  const sample = samplePageText();
  if (sample.length < MIN_SAMPLE_LENGTH) return;

  let detected: string | null = null;
  try {
    const resp = await sendToBackground<string>({ type: 'DETECT_LANGUAGE', payload: { text: sample } });
    if (resp && resp.success) detected = resp.data;
  } catch (err) {
    logger.debug('Language detection failed for prompt:', (err as Error).message);
    return;
  }

  if (
    !shouldPromptTranslate({
      detectedLang: detected,
      targetLang: settings.targetLang,
      hostname: host,
      autoSites,
      neverSites,
      dismissedHosts,
      autoDetectPrompt: settings.autoDetectPrompt,
    })
  ) {
    return;
  }

  renderBar(detected as string, settings, host, cbs);
}
