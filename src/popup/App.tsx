import React, { useState, useRef, useEffect } from 'react';
import { useSettings } from './hooks/useSettings';
import { useTranslationState } from './hooks/useTranslationState';
import { LANGUAGES, TARGET_LANGUAGES } from '@/constants/languages';
import { ENGINES } from '@/constants/engines';
import { TranslationEngine } from '@/types/translation';
import type { DisplayMode } from '@/types/settings';
import { CacheManager } from '../options/components/CacheManager';
import { sendToActiveTab } from '@/shared/message-bus';

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
    case TranslationEngine.MICROSOFT: return <MicrosoftIcon size={size} />;
    case TranslationEngine.DEEPL: return <DeepLIcon size={size} />;
    case TranslationEngine.OPENAI: return <OpenAIIcon size={size} />;
    case TranslationEngine.CLAUDE: return <ClaudeIcon size={size} />;
    default: return null;
  }
}

/* ─── Custom Engine Dropdown ─── */
function EngineDropdown({
  value,
  onChange,
  showFreeTag,
}: {
  value: TranslationEngine;
  onChange: (engine: TranslationEngine) => void;
  showFreeTag?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = ENGINES.find((e) => e.id === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="engine-dropdown" ref={ref}>
      <button className="engine-dropdown-trigger" onClick={() => setOpen(!open)}>
        <EngineIcon engineId={value} size={18} />
        <span className="engine-dropdown-name">{current?.name}</span>
        <svg className={`engine-dropdown-chevron ${open ? 'open' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      {open && (
        <div className="engine-dropdown-menu">
          {ENGINES.map((e) => (
            <button
              key={e.id}
              className={`engine-dropdown-item ${e.id === value ? 'selected' : ''}`}
              onClick={() => { onChange(e.id); setOpen(false); }}
            >
              <EngineIcon engineId={e.id} size={18} />
              <span className="engine-dropdown-item-name">{e.name}</span>
              {showFreeTag && !e.requiresKey && <span className="engine-free-tag">Free</span>}
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

  if (!settings) return <div className="popup-loading"><div className="spinner" /></div>;

  const isBilingual = settings.displayMode === 'bilingual';

  const needsKey = (engineId: TranslationEngine): boolean => {
    const info = ENGINES.find((e) => e.id === engineId);
    if (!info?.requiresKey) return false;
    return !settings.engineConfigs?.[engineId]?.apiKey;
  };

  const missingKey = needsKey(settings.engine);

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
    // Tell content script to switch mode retroactively
    sendToActiveTab({ type: 'SETTINGS_CHANGED', payload: { ...settings, displayMode: newMode } }).catch(() => {});
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
            <button className="btn-icon" onClick={() => setPage('settings')} title="Settings">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </header>

          <div className="lang-picker">
            <div className="lang-side">
              <span className="lang-label">From</span>
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6"/>
              </svg>
            </div>
            <div className="lang-side">
              <span className="lang-label">To</span>
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

          {/* Engine picker with logos */}
          <div className="engine-row">
            <EngineDropdown
              value={settings.engine}
              onChange={(engine) => updateSettings({ engine })}
              showFreeTag
            />
            {missingKey && (
              <div className="warn-wrap">
                <span className="engine-warn">!</span>
                <div className="warn-tooltip">
                  API key required. Go to{' '}
                  <button className="warn-link" onClick={() => setPage('settings')}>Settings</button>{' '}
                  to add your {currentEngine?.name} API key.
                </div>
              </div>
            )}
          </div>

          <button
            className={`cta ${isActive ? 'cta--active' : ''} ${status === 'translating' ? 'cta--loading' : ''} ${missingKey ? 'cta--disabled' : ''}`}
            onClick={toggle}
            disabled={status === 'translating' || missingKey}
            title={missingKey ? `Add your ${currentEngine?.name} API key in Settings first` : undefined}
          >
            {status === 'translating'
              ? 'Translating\u2026'
              : isActive
                ? 'Restore Original'
                : missingKey
                  ? 'API Key Required'
                  : 'Translate Page'}
          </button>

          <section className="quick">
            <h3 className="quick-title">Quick settings</h3>
            <label className="toggle-row">
              <span>Bilingual mode</span>
              <button
                className={`toggle ${isBilingual ? 'on' : ''}`}
                onClick={() => handleToggleMode(isBilingual ? 'replace' : 'bilingual')}
              />
            </label>
            <label className="toggle-row">
              <span>Hover translate</span>
              <button
                className={`toggle ${settings.hoverMode ? 'on' : ''}`}
                onClick={() => updateSettings({ hoverMode: !settings.hoverMode })}
              />
            </label>
          </section>

          <footer className="footer">
            <button className="footer-link" onClick={() => setPage('settings')}>
              All settings
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <span className="settings-title">Settings</span>
            <div className="settings-header-spacer" />
          </header>

          {/* GENERAL */}
          <div className="settings-section">
            <span className="section-label">General</span>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-name">Target Language</span>
                <span className="setting-desc">Language for translations</span>
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
                <span className="setting-name">Translation Engine</span>
                <span className="setting-desc">Default engine to use</span>
              </div>
              <EngineDropdown
                value={settings.engine}
                onChange={(engine) => updateSettings({ engine })}
                showFreeTag
              />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-name">Show Bilingual</span>
                <span className="setting-desc">Show translation below original text</span>
              </div>
              <button
                className={`toggle ${isBilingual ? 'on' : ''}`}
                onClick={() => handleToggleMode(isBilingual ? 'replace' : 'bilingual')}
              />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-name">Hover Translate</span>
                <span className="setting-desc">Translate text on hover</span>
              </div>
              <button
                className={`toggle ${settings.hoverMode ? 'on' : ''}`}
                onClick={() => updateSettings({ hoverMode: !settings.hoverMode })}
              />
            </div>
          </div>

          {/* API KEYS */}
          <div className="settings-section">
            <span className="section-label">API Keys</span>

            {enginesWithKeys.map((engine) => (
              <div className="setting-row api-key-row" key={engine.id}>
                <div className="setting-info">
                  <span className="engine-key-label">
                    <EngineIcon engineId={engine.id} size={16} />
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
                    placeholder={`Enter ${engine.name} API key`}
                  />
                  <button
                    className="api-key-toggle"
                    onClick={() => setShowKeys((prev) => ({ ...prev, [engine.id]: !prev[engine.id] }))}
                  >
                    {showKeys[engine.id] ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* INTERFACE */}
          <div className="settings-section">
            <span className="section-label">Interface</span>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-name">Bilingual Font Size</span>
                <span className="setting-desc">Adjust translation text size</span>
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
                <span className="setting-name">Text Color</span>
                <span className="setting-desc">Color for bilingual text</span>
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
                <span className="setting-name">Italic Text</span>
                <span className="setting-desc">Show translation in italic</span>
              </div>
              <button
                className={`toggle ${settings.translationStyle.italic ? 'on' : ''}`}
                onClick={() => updateSettings({ translationStyle: { ...settings.translationStyle, italic: !settings.translationStyle.italic } })}
              />
            </div>
          </div>

          {/* SHORTCUTS */}
          <div className="settings-section">
            <span className="section-label">Shortcuts</span>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-name">Quick Translate</span>
                <span className="setting-desc">Keyboard shortcut to toggle</span>
              </div>
              <div className="shortcut-keys">
                <kbd>Alt</kbd>+<kbd>A</kbd>
              </div>
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-name">Context Menu</span>
                <span className="setting-desc">Show 'Translate' in right-click menu</span>
              </div>
              <span className="setting-check">&#10003;</span>
            </div>
          </div>

          {/* DATA */}
          <div className="settings-section">
            <span className="section-label">Data</span>
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
