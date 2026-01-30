/**
 * LocalStorage service for persisting application state
 */

const STORAGE_KEYS = {
  WORKSPACE: 'c4_workspace',
  POSITIONS: 'c4_positions',
  SETTINGS: 'c4_settings',
} as const;

export class StorageService {
  /**
   * Save workspace to localStorage
   */
  saveWorkspace(workspace: unknown): void {
    try {
      localStorage.setItem(STORAGE_KEYS.WORKSPACE, JSON.stringify(workspace));
    } catch (error) {
      console.warn('Failed to save workspace to localStorage:', error);
    }
  }

  /**
   * Load workspace from localStorage
   */
  loadWorkspace<T>(): T | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WORKSPACE);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Failed to load workspace from localStorage:', error);
      return null;
    }
  }

  /**
   * Clear workspace from localStorage
   */
  clearWorkspace(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.WORKSPACE);
    } catch (error) {
      console.warn('Failed to clear workspace from localStorage:', error);
    }
  }

  /**
   * Save element positions
   */
  savePositions(positions: Record<string, { x: number; y: number }>): void {
    try {
      localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify(positions));
    } catch (error) {
      console.warn('Failed to save positions to localStorage:', error);
    }
  }

  /**
   * Load element positions
   */
  loadPositions(): Record<string, { x: number; y: number }> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.POSITIONS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.warn('Failed to load positions from localStorage:', error);
      return {};
    }
  }

  /**
   * Clear all stored data
   */
  clearAll(): void {
    try {
      Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear storage:', error);
    }
  }
}

// Singleton instance
export const storageService = new StorageService();
