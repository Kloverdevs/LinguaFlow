import { TranslationEngine } from '@/types/translation';
import { logger } from './logger';

const DB_NAME = 'immersive-translate-cache';
const STORE_NAME = 'translations';
const DB_VERSION = 1;
const MAX_ENTRIES = 10000;
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CachedTranslation {
  key: string;
  originalText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  engine: TranslationEngine;
  createdAt: number;
  accessedAt: number;
}

function generateKey(
  text: string,
  sourceLang: string,
  targetLang: string,
  engine: TranslationEngine
): string {
  // Simple hash using FNV-1a for speed
  const input = `${engine}:${sourceLang}:${targetLang}:${text.trim().toLowerCase()}`;
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('accessedAt', 'accessedAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getCached(
  text: string,
  sourceLang: string,
  targetLang: string,
  engine: TranslationEngine
): Promise<string | null> {
  try {
    const db = await openDB();
    const key = generateKey(text, sourceLang, targetLang, engine);
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const entry = request.result as CachedTranslation | undefined;
        if (!entry) {
          resolve(null);
          return;
        }
        // Check TTL
        if (Date.now() - entry.createdAt > TTL_MS) {
          store.delete(key);
          resolve(null);
          return;
        }
        // Update access time
        entry.accessedAt = Date.now();
        store.put(entry);
        resolve(entry.translatedText);
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function putCached(
  text: string,
  translatedText: string,
  sourceLang: string,
  targetLang: string,
  engine: TranslationEngine
): Promise<void> {
  try {
    const db = await openDB();
    const key = generateKey(text, sourceLang, targetLang, engine);
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const entry: CachedTranslation = {
      key,
      originalText: text,
      translatedText,
      sourceLang,
      targetLang,
      engine,
      createdAt: Date.now(),
      accessedAt: Date.now(),
    };

    store.put(entry);

    // Evict if over max
    const countReq = store.count();
    countReq.onsuccess = () => {
      if (countReq.result > MAX_ENTRIES) {
        evictOldest(store, countReq.result - MAX_ENTRIES);
      }
    };
  } catch (err) {
    logger.error('Cache put failed:', err);
  }
}

function evictOldest(store: IDBObjectStore, count: number): void {
  const index = store.index('accessedAt');
  const request = index.openCursor();
  let deleted = 0;

  request.onsuccess = () => {
    const cursor = request.result;
    if (cursor && deleted < count) {
      cursor.delete();
      deleted++;
      cursor.continue();
    }
  };
}

export async function clearCache(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).clear();
}

export async function getCacheStats(): Promise<{ count: number }> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    return new Promise((resolve) => {
      const req = store.count();
      req.onsuccess = () => resolve({ count: req.result });
      req.onerror = () => resolve({ count: 0 });
    });
  } catch {
    return { count: 0 };
  }
}
