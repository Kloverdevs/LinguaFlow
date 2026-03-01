import React, { useRef } from 'react';
import { useSettings } from '../../popup/hooks/useSettings';

export const SettingsBackup: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!settings) return null;

  const handleExport = () => {
    // Clone settings to avoid mutating state
    const exportData = { ...settings };
    
    // Convert to JSON
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `linguaflow-settings-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = event.target?.result as string;
        const importedSettings = JSON.parse(json);
        
        // Basic validation (ensure it looks like a Settings object)
        if (typeof importedSettings === 'object' && importedSettings !== null && 'engine' in importedSettings) {
          if (confirm('Are you sure you want to overwrite your current settings with this backup?')) {
            updateSettings(importedSettings);
            alert('Settings imported successfully!');
          }
        } else {
          alert('Invalid settings file format.');
        }
      } catch (err) {
        console.error('Import failed', err);
        alert('Failed to parse the settings file.');
      }
      
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex gap-4 mt-2">
      <button
        onClick={handleExport}
        className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded border border-gray-300 text-sm font-medium transition-colors"
      >
        Export Profile Config
      </button>
      
      <button
        onClick={handleImportClick}
        className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded border border-gray-300 text-sm font-medium transition-colors"
      >
        Import Profile Config
      </button>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />
    </div>
  );
};
