import React from 'react';
import { TranslationEngine } from '@/types/translation';
import { UserSettings } from '@/types/settings';
import { ENGINES } from '@/constants/engines';

interface Props {
  engine: TranslationEngine;
  onChange: (engine: TranslationEngine) => void;
  settings: UserSettings;
}

export function EngineSelector({ engine, onChange, settings }: Props) {
  const needsKey = (engineId: TranslationEngine): boolean => {
    const info = ENGINES.find((e) => e.id === engineId);
    if (!info?.requiresKey) return false;
    return !settings.engineConfigs?.[engineId]?.apiKey;
  };

  return (
    <div className="engine-selector">
      <label>Translation Engine</label>
      <div className="engine-options">
        {ENGINES.map((e) => (
          <button
            key={e.id}
            className={`engine-option ${engine === e.id ? 'selected' : ''}`}
            onClick={() => onChange(e.id)}
          >
            {e.name}
          </button>
        ))}
      </div>
      {needsKey(engine) && (
        <div className="engine-warning">
          API key required. Configure in Settings.
        </div>
      )}
    </div>
  );
}
