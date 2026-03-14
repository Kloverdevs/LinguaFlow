import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';

const EXCLUDE = new Set([
  'node_modules', 'dist', 'dist-firefox', '.git',
  'linguaflow-chrome.zip', 'linguaflow-firefox.zip', 'linguaflow-source.zip'
]);

const zip = new AdmZip();

function addDir(dir, zipPath) {
  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    if (EXCLUDE.has(entry)) continue;
    const fullPath = path.join(dir, entry);
    const entryZipPath = path.posix.join(zipPath, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      addDir(fullPath, entryZipPath);
    } else {
      zip.addLocalFile(fullPath, path.posix.dirname(entryZipPath));
    }
  }
}

addDir('.', '');

// Normalize all entry paths to forward slashes
for (const entry of zip.getEntries()) {
  if (entry.entryName.includes('\\')) {
    entry.entryName = entry.entryName.replace(/\\/g, '/');
  }
}

if (fs.existsSync('linguaflow-source.zip')) fs.unlinkSync('linguaflow-source.zip');
zip.writeZip('linguaflow-source.zip');
console.log(`Created linguaflow-source.zip (${zip.getEntries().length} entries)`);
