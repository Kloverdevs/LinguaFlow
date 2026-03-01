import { GlossaryEntry } from '@/types/glossary';

const GLOSSARY_STORAGE_KEY = 'linguaflow_glossary';

export async function getGlossary(): Promise<GlossaryEntry[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get([GLOSSARY_STORAGE_KEY], (result) => {
      resolve(result[GLOSSARY_STORAGE_KEY] || []);
    });
  });
}

export async function saveGlossaryEntry(entry: Omit<GlossaryEntry, 'id' | 'timestamp'>): Promise<GlossaryEntry> {
  const glossary = await getGlossary();
  
  // Check if entry already exists (same source term)
  const existingIndex = glossary.findIndex(e => e.sourceTerm.toLowerCase() === entry.sourceTerm.toLowerCase());
  
  const newEntry: GlossaryEntry = {
    ...entry,
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    timestamp: Date.now()
  };

  if (existingIndex >= 0) {
    // Update existing
    glossary[existingIndex] = { ...newEntry, id: glossary[existingIndex].id }; // Preserve ID
  } else {
    glossary.push(newEntry);
  }
  
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [GLOSSARY_STORAGE_KEY]: glossary }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(newEntry);
      }
    });
  });
}

export async function removeGlossaryEntry(id: string): Promise<void> {
  const glossary = await getGlossary();
  const updatedList = glossary.filter(e => e.id !== id);
  
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [GLOSSARY_STORAGE_KEY]: updatedList }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

export async function clearGlossary(): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove([GLOSSARY_STORAGE_KEY], () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

export function exportGlossaryAsCsv(glossary: GlossaryEntry[]): string {
  const header = 'Source Term,Target Term,Case Sensitive,Notes\n';
  const rows = glossary.map(v => {
    const source = `"${v.sourceTerm.replace(/"/g, '""')}"`;
    const target = `"${v.targetTerm.replace(/"/g, '""')}"`;
    const caseSens = v.caseSensitive ? 'TRUE' : 'FALSE';
    const context = v.context ? `"${v.context.replace(/"/g, '""')}"` : '""';
    return `${source},${target},${caseSens},${context}`;
  });
  return header + rows.join('\n');
}
