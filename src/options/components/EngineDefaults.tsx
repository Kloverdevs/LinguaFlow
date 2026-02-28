import React from 'react';
import { TranslationEngine } from '@/types/translation';
import { ENGINES } from '@/constants/engines';

interface Props {
  engine: TranslationEngine;
  onChange: (engine: TranslationEngine) => void;
}

export function EngineDefaults({ engine, onChange }: Props) {
  return (
    <div className="form-section">
      <h3>Default Translation Engine</h3>
      <div className="form-group">
        <select
          className="form-input"
          value={engine}
          onChange={(e) => onChange(e.target.value as TranslationEngine)}
        >
          {ENGINES.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name} {e.requiresKey ? '(API key required)' : '(Free)'}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
