import browser from 'webextension-polyfill';
import { VocabEntry } from '@/types/vocabulary';

const VOCAB_STORAGE_KEY = 'linguaflow_vocabulary';

export async function getVocabulary(): Promise<VocabEntry[]> {
  const result = await browser.storage.local.get([VOCAB_STORAGE_KEY]);
  return (result[VOCAB_STORAGE_KEY] as VocabEntry[]) || [];
}

export async function saveVocabEntry(entry: Omit<VocabEntry, 'id' | 'timestamp'>): Promise<VocabEntry> {
  const vocabList = await getVocabulary();
  
  // Check if entry already exists (same word and translation)
  const existing = vocabList.find(e => e.text.toLowerCase() === entry.text.toLowerCase() && e.translation === entry.translation);
  if (existing) {
    return existing;
  }

  const newEntry: VocabEntry = {
    ...entry,
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    timestamp: Date.now()
  };

  vocabList.push(newEntry);
  await browser.storage.local.set({ [VOCAB_STORAGE_KEY]: vocabList });
  return newEntry;
}

export async function removeVocabEntry(id: string): Promise<void> {
  const vocabList = await getVocabulary();
  const updatedList = vocabList.filter(e => e.id !== id);
  await browser.storage.local.set({ [VOCAB_STORAGE_KEY]: updatedList });
}

export async function clearVocabulary(): Promise<void> {
  await browser.storage.local.remove([VOCAB_STORAGE_KEY]);
}

export function exportVocabAsCsv(vocabList: VocabEntry[]): string {
  // Simple CSV export: Front, Back, Context, URL
  const header = 'Text,Translation,Context,URL\n';
  const rows = vocabList.map(v => {
    const text = `"${v.text.replace(/"/g, '""')}"`;
    const translation = `"${v.translation.replace(/"/g, '""')}"`;
    const context = v.context ? `"${v.context.replace(/"/g, '""')}"` : '""';
    const url = v.sourceUrl ? `"${v.sourceUrl.replace(/"/g, '""')}"` : '""';
    return `${text},${translation},${context},${url}`;
  });
  return header + rows.join('\n');
}
