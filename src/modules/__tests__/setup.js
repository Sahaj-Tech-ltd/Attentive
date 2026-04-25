/**
 * Vitest setup file for jsdom environment
 * Provides sessionStorage mock since jsdom doesn't have it by default
 */

// Mock sessionStorage for tests
const sessionStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] ?? null,
        setItem: (key, value) => {
            store[key] = value.toString();
        },
        removeItem: (key) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
        get length() {
            return Object.keys(store).length;
        },
        key: (index) => {
            const keys = Object.keys(store);
            return keys[index] ?? null;
        },
    };
})();

// Replace global sessionStorage with our mock
Object.defineProperty(globalThis, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
    configurable: true,
});
