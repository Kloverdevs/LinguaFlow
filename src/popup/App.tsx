import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useSettings } from './hooks/useSettings';
import { useTranslationState } from './hooks/useTranslationState';
import { LANGUAGES, TARGET_LANGUAGES } from '@/constants/languages';
import { ENGINES } from '@/constants/engines';
import { TranslationEngine } from '@/types/translation';
import type { DisplayMode, ThemeMode, UILocale } from '@/types/settings';
import { CacheManager } from '../options/components/CacheManager';
import { sendToActiveTab } from '@/shared/message-bus';
import { getStrings, UI_LOCALE_OPTIONS } from '@/shared/i18n';

type Page = 'main' | 'settings';

/* ─── Engine Icons (inline SVGs) ─── */
function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function BingIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 3v14.5l4.5 2.5 7-4v-4.5L10 8.5V3L5 5z" fill="#0078D4"/>
      <path d="M10 8.5l6.5 3V16l-7 4 4.5 2.5V16l-4-2.5z" fill="#0078D4" opacity=".7"/>
    </svg>
  );
}

function YandexIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#FC3F1D"/>
      <path d="M13.5 18h-2V12.6L8.2 6h2.3l2.3 4.8L15 6h2.2l-3.7 6.6V18z" fill="#fff"/>
    </svg>
  );
}

function LingvaIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#4CAF50"/>
      <path d="M7 8h10M9 8v1.5c0 2.5-1.5 4-3 5M12 8v1.5c0 2.5 1.5 4 3 5M8 17l4-3 4 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function MyMemoryIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#FF9800"/>
      <path d="M6 7h5v10H6z" fill="#fff" opacity=".9"/>
      <path d="M13 7h5v10h-5z" fill="#fff" opacity=".6"/>
      <path d="M9 10l3 2-3 2z" fill="#FF9800"/>
    </svg>
  );
}

function LibreIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#1976D2"/>
      <text x="12" y="16" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700" fontFamily="sans-serif">LT</text>
    </svg>
  );
}

function MicrosoftIcon({ size = 18 }: { size?: number }) {
  const s = size * 0.4;
  const g = size * 0.04;
  const off = size * 0.5 + g / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect x={size * 0.08} y={size * 0.08} width={s} height={s} fill="#F25022"/>
      <rect x={off} y={size * 0.08} width={s} height={s} fill="#7FBA00"/>
      <rect x={size * 0.08} y={off} width={s} height={s} fill="#00A4EF"/>
      <rect x={off} y={off} width={s} height={s} fill="#FFB900"/>
    </svg>
  );
}

function DeepLIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#0F2B46"/>
      <path d="M12 4L5 12l7 8 7-8-7-8z" fill="#0FA1E0" opacity=".7"/>
      <path d="M12 6l-5 6 5 6 5-6-5-6z" fill="#0DC5F4"/>
      <circle cx="12" cy="12" r="2.5" fill="#fff"/>
    </svg>
  );
}

function OpenAIIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#10A37F">
      <path d="M22.28 9.37a5.98 5.98 0 00-.52-4.93 6.07 6.07 0 00-6.54-2.94A5.98 5.98 0 0010.7.04 6.07 6.07 0 004.6 3.2a5.98 5.98 0 00-4 2.9 6.07 6.07 0 00.74 7.12 5.98 5.98 0 00.52 4.93 6.07 6.07 0 006.54 2.94 5.98 5.98 0 004.52 1.46 6.07 6.07 0 006.1-3.16 5.98 5.98 0 004-2.9 6.07 6.07 0 00-.74-7.12zM13.3 21.37a4.48 4.48 0 01-2.88-1.05l.14-.08 4.78-2.76a.77.77 0 00.4-.68v-6.74l2.02 1.17a.07.07 0 01.04.06v5.58a4.5 4.5 0 01-4.5 4.5zM3.82 17.5a4.48 4.48 0 01-.54-3.02l.14.09 4.78 2.76a.78.78 0 00.78 0l5.83-3.37v2.33a.07.07 0 01-.03.06l-4.83 2.79a4.5 4.5 0 01-6.13-1.64zM2.5 7.87a4.48 4.48 0 012.34-1.97V11.52a.77.77 0 00.4.68l5.83 3.37-2.02 1.17a.07.07 0 01-.07 0L4.15 13.95A4.5 4.5 0 012.5 7.87zm16.95 3.94l-5.83-3.37L15.64 7.27a.07.07 0 01.07 0l4.83 2.79a4.5 4.5 0 01-.7 8.12v-5.7a.77.77 0 00-.39-.67zm2.01-3.03l-.14-.09-4.78-2.76a.78.78 0 00-.78 0l-5.83 3.37V6.97a.07.07 0 01.03-.06l4.83-2.79a4.5 4.5 0 016.67 4.66zM8.68 13.05l-2.02-1.17a.07.07 0 01-.04-.06V6.24a4.5 4.5 0 017.38-3.45l-.14.08-4.78 2.76a.77.77 0 00-.4.68v6.74zm1.1-2.37l2.6-1.5 2.6 1.5v3l-2.6 1.5-2.6-1.5v-3z"/>
    </svg>
  );
}

function ClaudeIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M16.98 3.41L12.76 14.2l-1.4-4.13L16.98 3.41z" fill="#D97757"/>
      <path d="M11.36 10.07L7.02 3.41h3.94l2.2 6.46-1.8.2z" fill="#D97757"/>
      <path d="M7.02 3.41L11.36 10.07 9.76 14.82l-5.7-8.84L7.02 3.41z" fill="#D97757"/>
      <path d="M4.06 5.98l5.7 8.84L7.02 20.59 1.5 11.38l2.56-5.4z" fill="#D97757"/>
      <path d="M7.02 20.59l2.74-5.77 1.6 5.77H7.02z" fill="#D97757"/>
      <path d="M11.36 20.59l-1.6-5.77 2.04-5.94 3.18 11.71h-3.62z" fill="#D97757"/>
      <path d="M14.98 20.59L12.76 14.2l4.22-10.79 2.52 5.1-4.52 12.08z" fill="#D97757"/>
      <path d="M19.5 8.51l-4.52 12.08h3.06l3.46-7.21L19.5 8.51z" fill="#D97757"/>
    </svg>
  );
}

function EngineIcon({ engineId, size = 18 }: { engineId: TranslationEngine; size?: number }) {
  switch (engineId) {
    case TranslationEngine.GOOGLE_FREE: return <GoogleIcon size={size} />;
    case TranslationEngine.BING_FREE: return <BingIcon size={size} />;
    case TranslationEngine.YANDEX: return <YandexIcon size={size} />;
    case TranslationEngine.LINGVA: return <LingvaIcon size={size} />;
    case TranslationEngine.MYMEMORY: return <MyMemoryIcon size={size} />;
    case TranslationEngine.LIBRE_TRANSLATE: return <LibreIcon size={size} />;
    case TranslationEngine.MICROSOFT: return <MicrosoftIcon size={size} />;
    case TranslationEngine.DEEPL: return <DeepLIcon size={size} />;
    case TranslationEngine.OPENAI: return <OpenAIIcon size={size} />;
    case TranslationEngine.CLAUDE: return <ClaudeIcon size={size} />;
    default: return null;
  }
}

/* ─── Theme Toggle (simple sun/moon toggle) ─── */
function ThemeToggle({ theme, onChange, lightTitle, darkTitle }: { theme: ThemeMode; onChange: (t: ThemeMode) => void; lightTitle: string; darkTitle: string }) {
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleToggle = () => {
    onChange(isDark ? 'light' : 'dark');
  };

  return (
    <button className="theme-btn" onClick={handleToggle} title={isDark ? lightTitle : darkTitle}>
      {isDark ? (
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
        </svg>
      ) : (
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
        </svg>
      )}
    </button>
  );
}

/* ─── Custom Engine Dropdown ─── */
function EngineDropdown({
  value,
  onChange,
  showFreeTag,
  engines,
  freeLabel = 'Free',
}: {
  value: TranslationEngine;
  onChange: (engine: TranslationEngine) => void;
  showFreeTag?: boolean;
  engines: typeof ENGINES;
  freeLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuTop, setMenuTop] = useState(0);
  const current = engines.find((e) => e.id === value) ?? engines[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleOpen = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuTop(rect.bottom + 4);
    }
    setOpen(!open);
  };

  return (
    <div className="engine-dropdown" ref={ref}>
      <button className="engine-dropdown-trigger" ref={triggerRef} onClick={handleOpen}>
        <EngineIcon engineId={value} size={16} />
        <span className="engine-dropdown-name">{current?.name}</span>
        <svg className={`engine-dropdown-chevron ${open ? 'open' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      {open && (
        <div className="engine-dropdown-menu" style={{ top: menuTop }}>
          {engines.map((e) => (
            <button
              key={e.id}
              className={`engine-dropdown-item ${e.id === value ? 'selected' : ''}`}
              onClick={() => { onChange(e.id); setOpen(false); }}
            >
              <EngineIcon engineId={e.id} size={16} />
              <span className="engine-dropdown-item-name">{e.name}</span>
              {showFreeTag && !e.requiresKey && <span className="engine-free-tag">{freeLabel}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function App() {
  const { settings, updateSettings } = useSettings();
  const { isActive, status, toggle } = useTranslationState();
  const [page, setPage] = useState<Page>('main');
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [currentHost, setCurrentHost] = useState<string>('');

  // i18n
  const t = useMemo(() => getStrings(settings?.uiLocale ?? 'auto'), [settings?.uiLocale]);

  // Get current tab hostname
  useEffect(() => {
    chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        try { setCurrentHost(new URL(tabs[0].url).hostname); } catch {}
      }
    });
  }, []);

  // Apply theme to document
  const applyTheme = useCallback((mode: ThemeMode) => {
    if (mode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', mode);
    }
  }, []);

  useEffect(() => {
    if (!settings) return;
    applyTheme(settings.theme);

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (settings.theme === 'system') applyTheme('system');
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [settings?.theme, applyTheme]);

  // Apply popup scale using zoom for proper layout scaling
  useEffect(() => {
    if (!settings) return;
    const scale = settings.popupScale ?? 1;
    document.body.style.zoom = `${scale}`;
  }, [settings?.popupScale]);

  if (!settings) return <div className="popup-loading"><div className="spinner" /></div>;

  const isBilingual = settings.displayMode === 'bilingual';

  // Filter engines based on settings
  const visibleEngines = ENGINES.filter((e) => {
    if (!e.requiresKey && settings.showFreeEngines === false) return false;
    if (e.requiresKey && settings.showPaidEngines === false) return false;
    return true;
  });

  const needsKey = (engineId: TranslationEngine): boolean => {
    const info = ENGINES.find((e) => e.id === engineId);
    if (!info?.requiresKey) return false;
    const storedKey = settings.engineConfigs?.[engineId]?.apiKey;
    const pendingKey = apiKeys[engineId];
    return !storedKey && !pendingKey;
  };

  const missingKey = needsKey(settings.engine);
  // Only disable translate if not already active (allow Restore Original always)
  const shouldDisableTranslate = missingKey && !isActive;

  const getApiKey = (engine: TranslationEngine) =>
    apiKeys[engine] ?? settings.engineConfigs?.[engine]?.apiKey ?? '';

  const saveApiKey = (engine: TranslationEngine, key: string) => {
    setApiKeys((prev) => ({ ...prev, [engine]: key }));
    updateSettings({
      engineConfigs: {
        ...settings.engineConfigs,
        [engine]: {
          ...settings.engineConfigs?.[engine],
          engine,
          apiKey: key,
        },
      },
    });
  };

  const enginesWithKeys = ENGINES.filter((e) => e.requiresKey);
  const currentEngine = ENGINES.find((e) => e.id === settings.engine);

  const handleToggleMode = (newMode: DisplayMode) => {
    updateSettings({ displayMode: newMode });
    sendToActiveTab({ type: 'SETTINGS_CHANGED', payload: { ...settings, displayMode: newMode } }).catch(() => {});
  };

  // Engine visibility guards: at least one category must stay enabled
  const handleToggleFree = () => {
    if (settings.showFreeEngines && !settings.showPaidEngines) return; // can't disable both
    updateSettings({ showFreeEngines: !settings.showFreeEngines });
  };
  const handleTogglePaid = () => {
    if (settings.showPaidEngines && !settings.showFreeEngines) return; // can't disable both
    updateSettings({ showPaidEngines: !settings.showPaidEngines });
  };

  // Auto-translate site helpers
  const isAutoTranslate = currentHost && (settings.autoTranslateSites ?? []).includes(currentHost);

  const toggleAutoTranslate = () => {
    const sites = settings.autoTranslateSites ?? [];
    if (isAutoTranslate) {
      updateSettings({ autoTranslateSites: sites.filter((s) => s !== currentHost) });
    } else {
      updateSettings({
        autoTranslateSites: [...sites, currentHost],
        neverTranslateSites: (settings.neverTranslateSites ?? []).filter((s) => s !== currentHost),
      });
    }
  };

  return (
    <div className="app-shell">
      {/* ─── Main Page ─── */}
      <div className={`page page-main ${page === 'main' ? 'page-active' : 'page-left'}`}>
        <div className="popup">
          <header className="header">
            <div className="brand">
              <img src="/icons/logo.png" alt="" className="brand-logo" />
              <span className="brand-name">LinguaFlow</span>
            </div>
            <div className="header-actions">
              <ThemeToggle theme={settings.theme} onChange={(th) => updateSettings({ theme: th })} lightTitle={t.switchToLight} darkTitle={t.switchToDark} />
              <button className="btn-icon" onClick={() => setPage('settings')} title={t.settings}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
          </header>

          <div className="lang-picker">
            <div className="lang-side">
              <span className="lang-label">{t.from}</span>
              <select
                className="lang-value"
                value={settings.sourceLang}
                onChange={(e) => updateSettings({ sourceLang: e.target.value })}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>
            </div>
            <div className="lang-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6"/>
              </svg>
            </div>
            <div className="lang-side">
              <span className="lang-label">{t.to}</span>
              <select
                className="lang-value"
                value={settings.targetLang}
                onChange={(e) => updateSettings({ targetLang: e.target.value })}
              >
                {TARGET_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Engine picker */}
          <div className="engine-row">
            <EngineDropdown
              value={settings.engine}
              onChange={(engine) => updateSettings({ engine })}
              showFreeTag
              engines={visibleEngines}
              freeLabel={t.free}
            />
            {missingKey && (
              <div className="warn-wrap">
                <span className="engine-warn">!</span>
                <div className="warn-tooltip">
                  {t.apiKeyNeeded}{' '}
                  <button className="warn-link" onClick={() => setPage('settings')}>{t.goToSettings}</button>{' '}
                  ({currentEngine?.name})
                </div>
              </div>
            )}
          </div>

          <button
            className={`cta ${isActive ? 'cta--active' : ''} ${status === 'translating' ? 'cta--loading' : ''} ${shouldDisableTranslate ? 'cta--disabled' : ''}`}
            onClick={toggle}
            disabled={status === 'translating' || shouldDisableTranslate}
          >
            {status === 'translating'
              ? t.translating
              : isActive
                ? t.restoreOriginal
                : shouldDisableTranslate
                  ? t.apiKeyRequired
                  : t.translatePage}
          </button>

          <section className="quick">
            <label className="toggle-row">
              <span>{t.bilingualMode}</span>
              <button
                className={`toggle ${isBilingual ? 'on' : ''}`}
                onClick={() => handleToggleMode(isBilingual ? 'replace' : 'bilingual')}
              />
            </label>
            <label className="toggle-row">
              <span>{t.hoverTranslate}</span>
              <button
                className={`toggle ${settings.hoverMode ? 'on' : ''}`}
                onClick={() => updateSettings({ hoverMode: !settings.hoverMode })}
              />
            </label>
            {currentHost && (
              <label className="toggle-row">
                <span>{t.alwaysTranslateSite}</span>
                <button
                  className={`toggle ${isAutoTranslate ? 'on' : ''}`}
                  onClick={toggleAutoTranslate}
                />
              </label>
            )}
          </section>

          <footer className="footer">
            <button className="footer-link" onClick={() => setPage('settings')}>
              {t.allSettings}
            </button>
            <span className="footer-ver">v1.0.0</span>
          </footer>
        </div>
      </div>

      {/* ─── Settings Page ─── */}
      <div className={`page page-settings ${page === 'settings' ? 'page-active' : 'page-right'}`}>
        <div className="settings-scroll">
          <header className="settings-header">
            <button className="back-btn" onClick={() => setPage('main')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <span className="settings-title">{t.settings}</span>
            <div className="settings-header-spacer" />
          </header>

          {/* GENERAL */}
          <div className="settings-section">
            <span className="section-label">{t.general}</span>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-name">{t.uiLanguage}</span>
              </div>
              <select
                className="setting-select locale-select"
                value={settings.uiLocale ?? 'auto'}
                onChange={(e) => updateSettings({ uiLocale: e.target.value as UILocale })}
              >
                {UI_LOCALE_OPTIONS.map((loc) => (
                  <option key={loc.code} value={loc.code}>{loc.flag} {loc.name}</option>
                ))}
              </select>
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-name">{t.targetLanguage}</span>
              </div>
              <select
                className="setting-select"
                value={settings.targetLang}
                onChange={(e) => updateSettings({ targetLang: e.target.value })}
              >
                {TARGET_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-name">{t.translationEngine}</span>
              </div>
              <select
                className="setting-select"
                value={settings.engine}
                onChange={(e) => updateSettings({ engine: e.target.value as TranslationEngine })}
              >
                {visibleEngines.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}{!e.requiresKey ? ` (${t.free})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-name">{t.bilingualMode}</span>
              </div>
              <button
                className={`toggle ${isBilingual ? 'on' : ''}`}
                onClick={() => handleToggleMode(isBilingual ? 'replace' : 'bilingual')}
              />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-name">{t.hoverTranslate}</span>
              </div>
              <button
                className={`toggle ${settings.hoverMode ? 'on' : ''}`}
                onClick={() => updateSettings({ hoverMode: !settings.hoverMode })}
              />
            </div>
          </div>

          {/* ENGINES VISIBILITY */}
          <div className="settings-section">
            <span className="section-label">{t.engines}</span>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-name">{t.showFreeEngines}</span>
              </div>
              <button
                className={`toggle ${settings.showFreeEngines !== false ? 'on' : ''} ${settings.showFreeEngines && !settings.showPaidEngines ? 'toggle-locked' : ''}`}
                onClick={handleToggleFree}
              />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-name">{t.showPaidEngines}</span>
              </div>
              <button
                className={`toggle ${settings.showPaidEngines !== false ? 'on' : ''} ${settings.showPaidEngines && !settings.showFreeEngines ? 'toggle-locked' : ''}`}
                onClick={handleTogglePaid}
              />
            </div>
          </div>

          {/* API KEYS */}
          <div className="settings-section">
            <span className="section-label">{t.apiKeys}</span>

            {enginesWithKeys.map((engine) => (
              <div className="setting-row api-key-row" key={engine.id}>
                <div className="setting-info">
                  <span className="engine-key-label">
                    <EngineIcon engineId={engine.id} size={14} />
                    <span className="setting-name">{engine.name}</span>
                  </span>
                </div>
                <div className="api-key-input-wrap">
                  <input
                    className="api-key-input"
                    type={showKeys[engine.id] ? 'text' : 'password'}
                    value={getApiKey(engine.id)}
                    onChange={(e) => setApiKeys((prev) => ({ ...prev, [engine.id]: e.target.value }))}
                    onBlur={(e) => saveApiKey(engine.id, e.target.value)}
                    placeholder={t.enterApiKey.replace('{engine}', engine.name)}
                  />
                  <button
                    className="api-key-toggle"
                    onClick={() => setShowKeys((prev) => ({ ...prev, [engine.id]: !prev[engine.id] }))}
                  >
                    {showKeys[engine.id] ? t.hide : t.show}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* INTERFACE */}
          <div className="settings-section">
            <span className="section-label">{t.interface}</span>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-name">{t.popupSize}</span>
              </div>
              <div className="stepper">
                <button
                  className="stepper-btn"
                  onClick={() => updateSettings({ popupScale: Math.max(0.8, (settings.popupScale ?? 1) - 0.05) })}
                >
                  -
                </button>
                <span className="stepper-value">{Math.round((settings.popupScale ?? 1) * 100)}%</span>
                <button
                  className="stepper-btn"
                  onClick={() => updateSettings({ popupScale: Math.min(1.3, (settings.popupScale ?? 1) + 0.05) })}
                >
                  +
                </button>
              </div>
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-name">{t.bilingualFontSize}</span>
              </div>
              <div className="stepper">
                <button
                  className="stepper-btn"
                  onClick={() => updateSettings({ translationStyle: { ...settings.translationStyle, fontSize: Math.max(0.7, settings.translationStyle.fontSize - 0.02) } })}
                >
                  -
                </button>
                <span className="stepper-value">{Math.round(settings.translationStyle.fontSize * 100)}%</span>
                <button
                  className="stepper-btn"
                  onClick={() => updateSettings({ translationStyle: { ...settings.translationStyle, fontSize: Math.min(1.2, settings.translationStyle.fontSize + 0.02) } })}
                >
                  +
                </button>
              </div>
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-name">{t.fontFamily}</span>
              </div>
              <select
                className="setting-select"
                value={settings.translationStyle.fontFamily || 'inherit'}
                onChange={(e) => updateSettings({ translationStyle: { ...settings.translationStyle, fontFamily: e.target.value } })}
              >
                <option value="inherit">Default</option>
                <option value="'Segoe UI', sans-serif">Segoe UI</option>
                <option value="Arial, sans-serif">Arial</option>
                <option value="'Helvetica Neue', sans-serif">Helvetica</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="'Times New Roman', serif">Times New Roman</option>
                <option value="'Courier New', monospace">Courier New</option>
                <option value="Verdana, sans-serif">Verdana</option>
                <option value="Tahoma, sans-serif">Tahoma</option>
              </select>
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-name">{t.textColor}</span>
              </div>
              <input
                className="color-input"
                type="color"
                value={settings.translationStyle.color}
                onChange={(e) => updateSettings({ translationStyle: { ...settings.translationStyle, color: e.target.value } })}
              />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-name">{t.italicText}</span>
              </div>
              <button
                className={`toggle ${settings.translationStyle.italic ? 'on' : ''}`}
                onClick={() => updateSettings({ translationStyle: { ...settings.translationStyle, italic: !settings.translationStyle.italic } })}
              />
            </div>
          </div>

          {/* FLOATING BUTTON */}
          <div className="settings-section">
            <span className="section-label">{t.floatingButton}</span>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-name">{t.showFab}</span>
              </div>
              <button
                className={`toggle ${settings.fabEnabled !== false ? 'on' : ''}`}
                onClick={() => updateSettings({ fabEnabled: !(settings.fabEnabled !== false) })}
              />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-name">{t.fabSize}</span>
              </div>
              <div className="stepper">
                <button
                  className="stepper-btn"
                  onClick={() => updateSettings({ fabSize: Math.max(32, (settings.fabSize ?? 48) - 4) })}
                >
                  -
                </button>
                <span className="stepper-value">{settings.fabSize ?? 48}px</span>
                <button
                  className="stepper-btn"
                  onClick={() => updateSettings({ fabSize: Math.min(72, (settings.fabSize ?? 48) + 4) })}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* SHORTCUTS */}
          <div className="settings-section">
            <span className="section-label">{t.shortcuts}</span>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-name">{t.quickTranslate}</span>
              </div>
              <div className="shortcut-keys">
                <kbd>Alt</kbd>+<kbd>A</kbd>
              </div>
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-name">{t.contextMenu}</span>
              </div>
              <span className="setting-check">&#10003;</span>
            </div>
          </div>

          {/* DATA */}
          <div className="settings-section">
            <span className="section-label">{t.data}</span>
            <CacheManager />
          </div>

          <div className="settings-footer">
            <span className="settings-version">Version 1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
