/**
 * LocalStorage Service
 * Provides a type-safe wrapper around localStorage with error handling,
 * expiration support, and migration capabilities.
 */

const STORAGE_PREFIX = 'prioritiz_';
const STORAGE_VERSION = 1;

interface StorageItem<T> {
  value: T;
  version: number;
  timestamp: number;
  expiresAt?: number;
}

interface StorageOptions {
  expiresIn?: number; // milliseconds
}

class LocalStorageService {
  private prefix: string;
  private version: number;

  constructor(prefix: string = STORAGE_PREFIX, version: number = STORAGE_VERSION) {
    this.prefix = prefix;
    this.version = version;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * Get an item from localStorage
   */
  get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const fullKey = this.getKey(key);
      const item = localStorage.getItem(fullKey);

      if (!item) {
        return defaultValue;
      }

      const parsed: StorageItem<T> = JSON.parse(item);

      // Check expiration
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        this.remove(key);
        return defaultValue;
      }

      // Check version for potential migration
      if (parsed.version !== this.version) {
        console.warn(`Storage version mismatch for ${key}: ${parsed.version} vs ${this.version}`);
        // Could implement migration logic here
      }

      return parsed.value;
    } catch (error) {
      console.error(`Error reading from localStorage: ${key}`, error);
      return defaultValue;
    }
  }

  /**
   * Set an item in localStorage
   */
  set<T>(key: string, value: T, options: StorageOptions = {}): boolean {
    try {
      const fullKey = this.getKey(key);
      const item: StorageItem<T> = {
        value,
        version: this.version,
        timestamp: Date.now(),
        expiresAt: options.expiresIn ? Date.now() + options.expiresIn : undefined,
      };

      localStorage.setItem(fullKey, JSON.stringify(item));
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage: ${key}`, error);

      // Handle quota exceeded
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.handleQuotaExceeded();
      }

      return false;
    }
  }

  /**
   * Remove an item from localStorage
   */
  remove(key: string): boolean {
    try {
      const fullKey = this.getKey(key);
      localStorage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage: ${key}`, error);
      return false;
    }
  }

  /**
   * Check if an item exists
   */
  has(key: string): boolean {
    const fullKey = this.getKey(key);
    return localStorage.getItem(fullKey) !== null;
  }

  /**
   * Clear all items with this prefix
   */
  clear(): boolean {
    try {
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('Error clearing localStorage', error);
      return false;
    }
  }

  /**
   * Get all keys with this prefix
   */
  keys(): string[] {
    const keys: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        keys.push(key.replace(this.prefix, ''));
      }
    }

    return keys;
  }

  /**
   * Get storage usage info
   */
  getStorageInfo(): { used: number; available: number; percentage: number } {
    let used = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          used += key.length + value.length;
        }
      }
    }

    // Approximate 5MB limit for localStorage
    const available = 5 * 1024 * 1024;

    return {
      used,
      available,
      percentage: Math.round((used / available) * 100),
    };
  }

  /**
   * Handle quota exceeded by removing old/expired items
   */
  private handleQuotaExceeded(): void {
    console.warn('localStorage quota exceeded, cleaning up...');

    // Remove expired items first
    for (const key of this.keys()) {
      // Calling get() will automatically remove expired items
      this.get(key);
    }

    // Could implement LRU eviction here if needed
  }

  /**
   * Export all data for backup
   */
  export(): Record<string, unknown> {
    const data: Record<string, unknown> = {};

    for (const key of this.keys()) {
      data[key] = this.get(key);
    }

    return data;
  }

  /**
   * Import data from backup
   */
  import(data: Record<string, unknown>): boolean {
    try {
      for (const [key, value] of Object.entries(data)) {
        this.set(key, value);
      }
      return true;
    } catch (error) {
      console.error('Error importing data', error);
      return false;
    }
  }
}

// Singleton instance
export const storage = new LocalStorageService();

// Named exports for specific storage needs
export const todoStorage = new LocalStorageService('prioritiz_todos_');
export const settingsStorage = new LocalStorageService('prioritiz_settings_');

export default storage;
