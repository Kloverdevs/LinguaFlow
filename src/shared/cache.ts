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

/* ─── In-memory fallback when IndexedDB is unavailable (private browsing) ─── */
const memoryCache = new Map<string, CachedTranslation>();
let useMemoryFallback = false;

async function generateKey(
  text: string,
  sourceLang: string,
  targetLang: string,
  engine: TranslationEngine
): Promise<string> {
  const input = `${engine}:${sourceLang}:${targetLang}:${text.trim().toLowerCase()}`;
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
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

/* ─── Memory fallback helpers ─── */
function memoryGet(key: string): CachedTranslation | undefined {
  const entry = memoryCache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.createdAt > TTL_MS) {
    memoryCache.delete(key);
    return undefined;
  }
  entry.accessedAt = Date.now();
  return entry;
}

function memoryPut(entry: CachedTranslation): void {
  memoryCache.set(entry.key, entry);
  if (memoryCache.size > MAX_ENTRIES) {
    // Evict oldest by accessedAt
    let oldestKey = '';
    let oldestTime = Infinity;
    for (const [k, v] of memoryCache) {
      if (v.accessedAt < oldestTime) {
        oldestTime = v.accessedAt;
        oldestKey = k;
      }
    }
    if (oldestKey) memoryCache.delete(oldestKey);
  }
}

export async function getCached(
  text: string,
  sourceLang: string,
  targetLang: string,
  engine: TranslationEngine
): Promise<string | null> {
  const key = await generateKey(text, sourceLang, targetLang, engine);

  if (useMemoryFallback) {
    return memoryGet(key)?.translatedText ?? null;
  }

  try {
    const db = await openDB();
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
    useMemoryFallback = true;
    return memoryGet(key)?.translatedText ?? null;
  }
}

export async function putCached(
  text: string,
  translatedText: string,
  sourceLang: string,
  targetLang: string,
  engine: TranslationEngine
): Promise<void> {
  const key = await generateKey(text, sourceLang, targetLang, engine);
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

  if (useMemoryFallback) {
    memoryPut(entry);
    return;
  }

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    store.put(entry);

    // Evict if over max
    const countReq = store.count();
    countReq.onsuccess = () => {
      if (countReq.result > MAX_ENTRIES) {
        evictOldest(store, countReq.result - MAX_ENTRIES);
      }
    };
  } catch (err) {
    logger.error('Cache put failed, switching to memory fallback:', err);
    useMemoryFallback = true;
    memoryPut(entry);
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
  if (useMemoryFallback) {
    memoryCache.clear();
    return;
  }
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).clear();
}

export async function getCacheStats(): Promise<{ count: number }> {
  if (useMemoryFallback) {
    return { count: memoryCache.size };
  }
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
    return { count: memoryCache.size };
  }
}
