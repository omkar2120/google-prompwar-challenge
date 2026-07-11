import '@testing-library/jest-dom';

// Provide a fully-functional in-memory localStorage for tests. jsdom's built-in
// Storage can be inconsistent across versions (e.g. missing `clear`), so we
// install a deterministic mock the store + hooks can rely on.
class MemoryStorage {
  constructor() {
    this.store = new Map();
  }
  get length() {
    return this.store.size;
  }
  key(i) {
    return Array.from(this.store.keys())[i] ?? null;
  }
  getItem(k) {
    return this.store.has(k) ? this.store.get(k) : null;
  }
  setItem(k, v) {
    this.store.set(String(k), String(v));
  }
  removeItem(k) {
    this.store.delete(k);
  }
  clear() {
    this.store.clear();
  }
}

const memoryStorage = new MemoryStorage();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: memoryStorage,
});

// jsdom does not implement the canvas 2D context. Lottie (used by some UI
// components) calls getContext('2d') at import/render time and crashes without
// it, so we return a permissive no-op mock.
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = () =>
    new Proxy(
      {},
      {
        get: () => () => {},
      }
    );
}
