// Provide a proper localStorage polyfill for Zustand persist middleware
// This runs before any test file imports, ensuring the store module
// gets a working localStorage when it initializes.

const storageMap = new Map<string, string>();

const localStorageMock: Storage = {
  getItem: (key: string) => storageMap.get(key) ?? null,
  setItem: (key: string, value: string) => {
    storageMap.set(key, value);
  },
  removeItem: (key: string) => {
    storageMap.delete(key);
  },
  clear: () => {
    storageMap.clear();
  },
  get length() {
    return storageMap.size;
  },
  key: (index: number) => [...storageMap.keys()][index] ?? null,
};

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
  configurable: true,
});
