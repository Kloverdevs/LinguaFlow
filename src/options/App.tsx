import React, { useState } from 'react';
import { useSettings } from '../popup/hooks/useSettings';
import { ENGINES } from '@/constants/engines';
import { TARGET_LANGUAGES } from '@/constants/languages';
import { TranslationEngine } from '@/types/translation';
import type { DisplayMode } from '@/types/settings';
import { CacheManager } from './components/CacheManager';
import { VocabManager } from './components/VocabManager';
import { GlossaryManager } from './components/GlossaryManager';
import { SiteRulesManager } from './components/SiteRulesManager';
import { SettingsBackup } from './components/SettingsBackup';

export function App() {
  const { settings, updateSettings } = useSettings();
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [customPrompts, setCustomPrompts] = useState<Record<string, string>>({});

  if (!settings) return <div className="settings-loading">Loading...</div>;

  const isBilingual = settings.displayMode === 'bilingual';

  const getApiKey = (engine: TranslationEngine) =>
    apiKeys[engine] ?? settings.engineConfigs?.[engine]?.apiKey ?? '';

  const needsKey = (engineId: TranslationEngine): boolean => {
    const info = ENGINES.find((e) => e.id === engineId);
    if (!info?.requiresKey) return false;
    return !getApiKey(engineId);
  };

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

  const getCustomPrompt = (engine: TranslationEngine) =>
    customPrompts[engine] ?? settings.engineConfigs?.[engine]?.customPrompt ?? '';

  const saveCustomPrompt = (engine: TranslationEngine, prompt: string) => {
    setCustomPrompts((prev) => ({ ...prev, [engine]: prompt }));
    updateSettings({
      engineConfigs: {
        ...settings.engineConfigs,
        [engine]: {
          ...settings.engineConfigs?.[engine],
          engine,
          customPrompt: prompt,
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
              <option key={e.id} value={e.id} disabled={needsKey(e.id)}>
                {e.name} {e.requiresKey ? '' : '(Free)'}{needsKey(e.id) ? ' (Needs Key)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <span className="setting-name">Compare Engine</span>
            <span className="setting-desc">Secondary engine for comparison mode</span>
          </div>
          <select
            className="setting-select"
            value={settings.compareEngine || ''}
            onChange={(e) => updateSettings({ compareEngine: e.target.value ? e.target.value as TranslationEngine : undefined })}
          >
            <option value="">None (Disabled)</option>
            {ENGINES.map((e) => (
              <option key={e.id} value={e.id} disabled={needsKey(e.id)}>
                {e.name} {e.requiresKey ? '' : '(Free)'}{needsKey(e.id) ? ' (Needs Key)' : ''}
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

        <div className="setting-row">
          <div className="setting-info">
            <span className="setting-name">Sync Preferences</span>
            <span className="setting-desc">Sync settings (excluding API keys) across signed-in browsers</span>
          </div>
          <button
            className={`settings-toggle ${settings.enableSync ? 'active' : ''}`}
            onClick={() => updateSettings({ enableSync: !settings.enableSync })}
          />
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <span className="setting-name">Dyslexia-friendly Font</span>
            <span className="setting-desc">Use a highly readable font for translation blocks</span>
          </div>
          <button
            className={`settings-toggle ${settings.dyslexiaFont ? 'active' : ''}`}
            onClick={() => updateSettings({ dyslexiaFont: !settings.dyslexiaFont })}
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
            
            {(engine.id === TranslationEngine.OPENAI || engine.id === TranslationEngine.CLAUDE) && (
              <div className="api-key-input-wrap" style={{ display: 'block', marginTop: '10px' }}>
                <span className="setting-desc" style={{ display: 'block', marginBottom: '4px' }}>Custom System Prompt (Optional)</span>
                <textarea
                  className="api-key-input"
                  style={{ width: '100%', minHeight: '60px', padding: '8px', resize: 'vertical' }}
                  value={getCustomPrompt(engine.id as TranslationEngine)}
                  onChange={(e) => setCustomPrompts((prev) => ({ ...prev, [engine.id]: e.target.value }))}
                  onBlur={(e) => saveCustomPrompt(engine.id as TranslationEngine, e.target.value)}
                  placeholder="e.g. Translate this as a technical manual..."
                />
              </div>
            )}
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

      {/* ─── SITE RULES ─── */}
      <div className="settings-section">
        <span className="section-label">PER-SITE RULES</span>
        <SiteRulesManager />
      </div>

      {/* ─── VOCABULARY ─── */}
      <div className="settings-section">
        <span className="section-label">VOCABULARY</span>
        <VocabManager />
      </div>

      {/* ─── GLOSSARY ─── */}
      <div className="settings-section">
        <span className="section-label">CUSTOM GLOSSARY</span>
        <GlossaryManager />
      </div>

      {/* ─── DATA & BACKUP ─── */}
      <div className="settings-section">
        <span className="section-label">DATA & BACKUP</span>
        <CacheManager />
        <div className="mt-6 pt-4 border-t border-gray-200">
          <SettingsBackup />
        </div>
      </div>

      {/* ─── Footer ─── */}
      <div className="settings-footer">
        <span className="settings-version">Version 1.0.0</span>
      </div>
    </div>
  );
}
