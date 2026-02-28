import React from 'react';
import { TranslationStyle } from '@/types/settings';

interface Props {
  style: TranslationStyle;
  onChange: (style: TranslationStyle) => void;
}

export function StylePreferences({ style, onChange }: Props) {
  const update = (partial: Partial<TranslationStyle>) => {
    onChange({ ...style, ...partial });
  };

  return (
    <div className="form-section">
      <h3>Translation Display Style</h3>

      <div className="form-group">
        <label>Font Size</label>
        <div className="slider-row">
          <input
            type="range"
            min="0.7"
            max="1.2"
            step="0.02"
            value={style.fontSize}
            onChange={(e) => update({ fontSize: parseFloat(e.target.value) })}
          />
          <span className="slider-value">{style.fontSize}em</span>
        </div>
      </div>

      <div className="form-group">
        <label>Text Color</label>
        <div className="color-row">
          <input
            type="color"
            value={style.color}
            onChange={(e) => update({ color: e.target.value })}
          />
          <span>{style.color}</span>
        </div>
      </div>

      <div className="form-group">
        <label>Border Color</label>
        <div className="color-row">
          <input
            type="color"
            value={style.borderColor}
            onChange={(e) => update({ borderColor: e.target.value })}
          />
          <span>{style.borderColor}</span>
        </div>
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={style.italic}
            onChange={(e) => update({ italic: e.target.checked })}
            style={{ marginRight: 8 }}
          />
          Italic text
        </label>
      </div>
    </div>
  );
}
