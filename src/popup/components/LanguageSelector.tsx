import React from 'react';
import { LANGUAGES, TARGET_LANGUAGES } from '@/constants/languages';

interface Props {
  sourceLang: string;
  targetLang: string;
  onSourceChange: (lang: string) => void;
  onTargetChange: (lang: string) => void;
}

export function LanguageSelector({
  sourceLang,
  targetLang,
  onSourceChange,
  onTargetChange,
}: Props) {
  const handleSwap = () => {
    if (sourceLang !== 'auto') {
      onSourceChange(targetLang);
      onTargetChange(sourceLang);
    }
  };

  return (
    <div className="language-selector">
      <select
        className="language-select"
        value={sourceLang}
        onChange={(e) => onSourceChange(e.target.value)}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>

      <button
        className="swap-btn"
        onClick={handleSwap}
        title="Swap languages"
        disabled={sourceLang === 'auto'}
      >
        ⇄
      </button>

      <select
        className="language-select"
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
  );
}
