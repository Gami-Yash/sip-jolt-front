// Safe localStorage wrapper that prevents crashes from QuotaExceededError
// Critical for iOS Safari private mode and storage-restricted contexts
// V2: Added typeof window checks for SSR/mobile compatibility

// Check if localStorage is available
const isStorageAvailable = () => {
  if (typeof window === 'undefined') return false;
  try {
    const test = '__storage_test__';
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

const storageAvailable = isStorageAvailable();

export const safeStorage = {
  getItem: (key, fallback = null) => {
    if (!storageAvailable) return fallback;
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? item : fallback;
    } catch (error) {
      console.warn(`[Storage] Failed to read ${key}:`, error.message);
      return fallback;
    }
  },

  setItem: (key, value) => {
    if (!storageAvailable) return false;
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`[Storage] Failed to write ${key}:`, error.message);
      return false;
    }
  },

  removeItem: (key) => {
    if (!storageAvailable) return false;
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`[Storage] Failed to remove ${key}:`, error.message);
      return false;
    }
  },

  // Parse JSON safely
  getJSON: (key, fallback = null) => {
    if (!storageAvailable) return fallback;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (error) {
      console.warn(`[Storage] Failed to parse JSON for ${key}:`, error.message);
      // Clean up corrupted data
      try {
        window.localStorage.removeItem(key);
      } catch (e) {
        // Silent fail if removeItem also fails
      }
      return fallback;
    }
  },

  // Set JSON safely
  setJSON: (key, value) => {
    if (!storageAvailable) return false;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`[Storage] Failed to stringify/write ${key}:`, error.message);
      return false;
    }
  }
};
