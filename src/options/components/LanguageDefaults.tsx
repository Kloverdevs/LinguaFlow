import React from 'react';
import { LANGUAGES, TARGET_LANGUAGES } from '@/constants/languages';

interface Props {
  sourceLang: string;
  targetLang: string;
  onSourceChange: (lang: string) => void;
  onTargetChange: (lang: string) => void;
}

export function LanguageDefaults({
  sourceLang,
  targetLang,
  onSourceChange,
  onTargetChange,
}: Props) {
  return (
    <div className="form-section">
      <h3>Default Languages</h3>
      <div className="form-group">
        <label>Source Language</label>
        <select
          className="form-input"
          value={sourceLang}
          onChange={(e) => onSourceChange(e.target.value)}
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Target Language</label>
        <select
          className="form-input"
          value={targetLang}
          onChange={(e) => onTargetChange(e.target.value)}
        >
          {TARGET_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
