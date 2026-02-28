import React from 'react';

interface Props {
  isActive: boolean;
  onToggle: () => void;
}

export function TranslateToggle({ isActive, onToggle }: Props) {
  return (
    <div className="toggle-container">
      <span className="toggle-label">
        {isActive ? 'Translation On' : 'Translation Off'}
      </span>
      <button
        className={`toggle-switch ${isActive ? 'active' : ''}`}
        onClick={onToggle}
        aria-label="Toggle translation"
      />
    </div>
  );
}
