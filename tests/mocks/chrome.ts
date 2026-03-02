import { vi } from 'vitest';

// Minimal chrome API mock for unit tests
const storageMock: Record<string, unknown> = {};

const chrome = {
  storage: {
    local: {
      get: vi.fn((keys: any, cb?: (result: Record<string, unknown>) => void) => {
        const result: Record<string, unknown> = {};
        if (keys === null || keys === undefined) {
          Object.assign(result, storageMock);
        } else if (typeof keys === 'string') {
          if (keys in storageMock) result[keys] = storageMock[keys];
        } else if (Array.isArray(keys)) {
          for (const k of keys) {
            if (k in storageMock) result[k] = storageMock[k];
          }
        } else if (typeof keys === 'object') {
          for (const k in keys) {
            result[k] = k in storageMock ? storageMock[k] : keys[k];
          }
        }
        if (typeof cb === 'function') {
          cb(result);
          return Promise.resolve(result);
        }
        return Promise.resolve(result);
      }),
      set: vi.fn((items: Record<string, unknown>, cb?: () => void) => {
        Object.assign(storageMock, items);
        if (cb) cb();
        return Promise.resolve();
      }),
      remove: vi.fn((keys: string | string[], cb?: () => void) => {
        const keyArr = typeof keys === 'string' ? [keys] : keys;
        for (const k of keyArr) delete storageMock[k];
        if (cb) cb();
        return Promise.resolve();
      }),
    },
    sync: {
      get: vi.fn((keys: any, cb?: (result: Record<string, unknown>) => void) => {
        const result: Record<string, unknown> = {};
        if (keys === null || keys === undefined) {
          Object.assign(result, storageMock);
        } else if (typeof keys === 'string') {
          if (keys in storageMock) result[keys] = storageMock[keys];
        } else if (Array.isArray(keys)) {
          for (const k of keys) {
            if (k in storageMock) result[k] = storageMock[k];
          }
        } else if (typeof keys === 'object') {
          for (const k in keys) {
            result[k] = k in storageMock ? storageMock[k] : keys[k];
          }
        }
        if (typeof cb === 'function') {
          cb(result);
          return Promise.resolve(result);
        }
        return Promise.resolve(result);
      }),
      set: vi.fn((items: Record<string, unknown>, cb?: () => void) => {
        Object.assign(storageMock, items);
        if (cb) cb();
        return Promise.resolve();
      }),
      remove: vi.fn((keys: string | string[], cb?: () => void) => {
        const keyArr = typeof keys === 'string' ? [keys] : keys;
        for (const k of keyArr) delete storageMock[k];
        if (cb) cb();
        return Promise.resolve();
      }),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  runtime: {
    id: 'test-extension-id',
    sendMessage: vi.fn(() => Promise.resolve({ success: true })),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    openOptionsPage: vi.fn(),
    getURL: vi.fn((path: string) => `chrome-extension://test-id/${path}`),
  },
  tabs: {
    sendMessage: vi.fn(() => Promise.resolve({ success: true })),
    query: vi.fn(() => Promise.resolve([])),
  },
  contextMenus: {
    create: vi.fn(),
    onClicked: {
      addListener: vi.fn(),
    },
  },
  commands: {
    onCommand: {
      addListener: vi.fn(),
    },
  },
  action: {
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn(),
  },
};

globalThis.speechSynthesis = {
  cancel: vi.fn(),
  speak: vi.fn(),
  getVoices: vi.fn(() => []),
  pause: vi.fn(),
  resume: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(() => true),
  pending: false,
  speaking: false,
  paused: false,
  onvoiceschanged: null,
};

globalThis.SpeechSynthesisUtterance = vi.fn().mockImplementation((text) => ({
  text,
  lang: '',
  pitch: 1,
  rate: 1,
  volume: 1,
  voice: null,
  onerror: null,
  onstart: null,
  onend: null,
  onpause: null,
  onresume: null,
  onmark: null,
  onboundary: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(() => true)
})) as any;

// Stub DOMParser to prevent jsdom timeout loops when parsing raw HTML fragments
globalThis.DOMParser = class DOMParserMock {
  parseFromString(string: string) {
    // Return a dummy document structure that satisfies .body.textContent
    return {
      body: {
        textContent: string.replace(/<[^>]*>?/gm, '') // Strips HTML tags for the textContent mock
      }
    };
  }
} as any;

Object.assign(globalThis, { chrome });
