import React from 'react';

export function SettingsLink() {
  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <button className="settings-link" onClick={openSettings} title="Settings">
      &#9881;
    </button>
  );
}
