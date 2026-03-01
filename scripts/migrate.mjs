import fs from 'fs';

const files = [
  'src/background/context-menu.ts',
  'src/background/index.ts',
  'src/background/keyboard-shortcuts.ts',
  'src/background/message-handler.ts',
  'src/content/image-translator.ts',
  'src/content/index.ts',
  'src/content/pdf-handler.ts',
  'src/engines/chrome-builtin-engine.ts',
  'src/popup/App.tsx',
  'src/popup/components/SettingsLink.tsx',
  'src/popup/hooks/useSettings.ts',
  'src/popup/hooks/useTranslationState.ts',
  'src/shared/message-bus.ts',
  'src/shared/storage.ts',
  'src/welcome/Welcome.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes("import browser from 'webextension-polyfill'")) continue;

  // Temporarily replace all `chrome.` calls to `browser.`
  content = content.replace(/chrome\./g, 'browser.');
  content = `import browser from 'webextension-polyfill';\n` + content;
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('Migrated', file);
}
