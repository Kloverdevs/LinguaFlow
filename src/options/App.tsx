import React, { useState } from 'react';
import { useSettings } from '../popup/hooks/useSettings';
import { ENGINES } from '@/constants/engines';
import { TARGET_LANGUAGES } from '@/constants/languages';
import { TranslationEngine } from '@/types/translation';
import type { DisplayMode } from '@/types/settings';
import { CacheManager } from './components/CacheManager';

export function App() {
  const { settings, updateSettings } = useSettings();
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  if (!settings) return <div className="settings-loading">Loading...</div>;

  const isBilingual = settings.displayMode === 'bilingual';

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

  return (
    <div className="settings-root">
      {/* ─── Header ─── */}
      <div className="settings-header">
        <h1 className="settings-title">LinguaFlow Settings</h1>
      </div>

      {/* ─── GENERAL ─── */}
      <div className="settings-section">
        <span className="section-label">GENERAL</span>

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
          <select
            className="setting-select"
            value={settings.engine}
            onChange={(e) => updateSettings({ engine: e.target.value as TranslationEngine })}
          >
            {ENGINES.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} {e.requiresKey ? '' : '(Free)'}
              </option>
            ))}
          </select>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <span className="setting-name">Show Bilingual</span>
            <span className="setting-desc">Show translation below original text</span>
          </div>
          <button
            className={`settings-toggle ${isBilingual ? 'active' : ''}`}
            onClick={() => updateSettings({ displayMode: (isBilingual ? 'replace' : 'bilingual') as DisplayMode })}
          />
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <span className="setting-name">Hover Translate</span>
            <span className="setting-desc">Translate text on hover</span>
          </div>
          <button
            className={`settings-toggle ${settings.hoverMode ? 'active' : ''}`}
            onClick={() => updateSettings({ hoverMode: !settings.hoverMode })}
          />
        </div>
      </div>

      {/* ─── API KEYS ─── */}
      <div className="settings-section">
        <span className="section-label">API KEYS</span>

        {enginesWithKeys.map((engine) => (
          <div className="setting-row api-key-row" key={engine.id}>
            <div className="setting-info">
              <span className="setting-name">{engine.name}</span>
            </div>
            <div className="api-key-input-wrap">
              <input
                className="api-key-input"
                type={showKeys[engine.id] ? 'text' : 'password'}
                value={getApiKey(engine.id)}
                onChange={(e) => setApiKeys((prev) => ({ ...prev, [engine.id]: e.target.value }))}
                onBlur={(e) => saveApiKey(engine.id, e.target.value)}
                placeholder="Enter API key"
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

      {/* ─── INTERFACE ─── */}
      <div className="settings-section">
        <span className="section-label">INTERFACE</span>

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
            className={`settings-toggle ${settings.translationStyle.italic ? 'active' : ''}`}
            onClick={() => updateSettings({ translationStyle: { ...settings.translationStyle, italic: !settings.translationStyle.italic } })}
          />
        </div>
      </div>

      {/* ─── SHORTCUTS ─── */}
      <div className="settings-section">
        <span className="section-label">SHORTCUTS</span>

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

      {/* ─── CACHE ─── */}
      <div className="settings-section">
        <span className="section-label">DATA</span>
        <CacheManager />
      </div>

      {/* ─── Footer ─── */}
      <div className="settings-footer">
        <span className="settings-version">Version 1.0.0</span>
      </div>
    </div>
  );
}
