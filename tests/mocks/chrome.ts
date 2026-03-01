import { vi } from 'vitest';

// Minimal chrome API mock for unit tests
const storageMock: Record<string, unknown> = {};

const chrome = {
  storage: {
    local: {
      get: vi.fn((keys: string | string[], cb?: (result: Record<string, unknown>) => void) => {
        const result: Record<string, unknown> = {};
        const keyArr = typeof keys === 'string' ? [keys] : keys;
        for (const k of keyArr) {
          if (k in storageMock) result[k] = storageMock[k];
        }
        if (cb) cb(result);
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
      get: vi.fn((keys: string | string[], cb?: (result: Record<string, unknown>) => void) => {
        const result: Record<string, unknown> = {};
        const keyArr = typeof keys === 'string' ? [keys] : keys;
        for (const k of keyArr) {
          if (k in storageMock) result[k] = storageMock[k];
        }
        if (cb) cb(result);
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

Object.assign(globalThis, { chrome });
