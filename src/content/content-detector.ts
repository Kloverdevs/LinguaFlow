const EXCLUDED_TAGS = new Set([
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT', 'EMBED',
  'SVG', 'CANVAS', 'VIDEO', 'AUDIO', 'MAP', 'INPUT', 'TEXTAREA',
  'SELECT', 'BUTTON', 'CODE', 'PRE', 'KBD', 'SAMP', 'OPTION',
]);

/**
 * Roles that should be excluded from translation.
 * NOTE: We intentionally do NOT exclude 'navigation', 'form', 'dialog' here
 * because they often contain translatable text (nav links, form labels, dialog content).
 * The TreeWalker still walks into them — individual elements inside are checked.
 */
const EXCLUDED_ROLES = new Set([
  'search', 'menu', 'menubar', 'toolbar',
  'tab', 'tablist', 'alertdialog', 'status',
  'progressbar', 'scrollbar', 'slider', 'spinbutton',
]);

/**
 * Class patterns that strongly indicate non-content areas.
 * Only match definitive ad/sponsor patterns — avoid false positives.
 */
const EXCLUDED_CLASS_PATTERNS = [
  /\b(ad|ads|advert|advertisement|sponsor)\b/i,
  /\b(comment-form|reply-form|login-form)\b/i,
];

// Our own injected elements — never translate these
const OWN_SELECTORS = [
  '#immersive-translate-fab',
  '#immersive-translate-fab-menu',
  '#immersive-translate-onboarding',
  '[data-immersive-block]',
];

export function shouldExcludeElement(el: Element): boolean {
  if (EXCLUDED_TAGS.has(el.tagName)) return true;

  const role = el.getAttribute('role');
  if (role && EXCLUDED_ROLES.has(role)) return true;

  // Skip elements that are hidden via inline style
  if (el instanceof HTMLElement) {
    const style = el.style;
    if (style.display === 'none' || style.visibility === 'hidden') return true;
  }

  // Skip elements with aria-hidden
  if (el.getAttribute('aria-hidden') === 'true') return true;

  // Skip our own UI elements
  for (const sel of OWN_SELECTORS) {
    if (el.matches(sel)) return true;
  }

  // Only exclude by class if it's clearly an ad
  const classAndId = `${el.className} ${el.id}`;
  if (typeof classAndId === 'string' && classAndId.length > 0) {
    return EXCLUDED_CLASS_PATTERNS.some((p) => p.test(classAndId));
  }
  return false;
}

/**
 * Detect the language of a text string using simple heuristics.
 */
export function detectTextScript(text: string): 'latin' | 'cjk' | 'cyrillic' | 'arabic' | 'other' {
  const cleaned = text.replace(/[\s\d\p{P}\p{S}]/gu, '');
  if (cleaned.length === 0) return 'other';

  let latin = 0, cjk = 0, cyrillic = 0, arabic = 0;

  for (const char of cleaned) {
    const code = char.codePointAt(0)!;
    if ((code >= 0x0041 && code <= 0x024F) || (code >= 0x1E00 && code <= 0x1EFF)) latin++;
    else if ((code >= 0x4E00 && code <= 0x9FFF) || (code >= 0x3040 && code <= 0x30FF) || (code >= 0xAC00 && code <= 0xD7AF)) cjk++;
    else if (code >= 0x0400 && code <= 0x04FF) cyrillic++;
    else if (code >= 0x0600 && code <= 0x06FF) arabic++;
  }

  const total = cleaned.length;
  if (latin / total > 0.5) return 'latin';
  if (cjk / total > 0.3) return 'cjk';
  if (cyrillic / total > 0.5) return 'cyrillic';
  if (arabic / total > 0.5) return 'arabic';
  return 'other';
}

/**
 * Check if text is substantive enough to translate.
 * CJK-aware: single CJK characters carry full word meaning, so we use
 * a lower character threshold for non-Latin scripts.
 */
export function isSubstantiveText(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0) return false;

  // Strip whitespace, digits, punctuation, symbols
  const letters = trimmed.replace(/[\s\d\p{P}\p{S}]/gu, '');
  if (letters.length === 0) return false;

  // CJK check: each character is a word, so even 2 chars is meaningful
  const script = detectTextScript(trimmed);
  if (script === 'cjk') {
    return letters.length >= 1; // Even a single CJK character can be a meaningful heading
  }

  // For Latin/Cyrillic/Arabic: require at least 2 letters
  if (letters.length < 2) return false;

  return true;
}

/**
 * Get the page's declared language from html[lang] or meta tags.
 */
export function getPageLanguage(): string | null {
  const htmlLang = document.documentElement.lang;
  if (htmlLang) return htmlLang.split('-')[0].toLowerCase();

  const meta = document.querySelector('meta[http-equiv="content-language"]');
  if (meta) {
    const content = meta.getAttribute('content');
    if (content) return content.split('-')[0].toLowerCase();
  }

  return null;
}
