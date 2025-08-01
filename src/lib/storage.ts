// 🔒 CRITICAL: Storage utilities for warehouse data management
// ⚠️ NEVER modify storage keys - data persistence depends on them
// 🔒 See EPW_EXCEPTIONS.md for EPW exceptions documentation

export const STORAGE_KEYS = {
  PRODUCTS: 'warehouse-products',
  MATERIALS: 'warehouse-materials',
  MOVEMENTS: 'warehouse-movements',
  EXCLUSIONS: 'product-exclusions',
  // EPW Exceptions use separate keys - see /src/lib/epwExceptions.ts
} as const;

export const loadFromStorage = <T>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

export const saveToStorage = (key: string, data: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
};

// Exclusions specific storage utilities
export interface ExclusionSettings {
  enabled: boolean;
  prefixes: string[];
  createdAt: string;
  updatedAt: string;
}

export const loadExclusions = (): ExclusionSettings => {
  const exclusions = loadFromStorage(STORAGE_KEYS.EXCLUSIONS, {
    enabled: true,
    prefixes: ['ZZZ'], // Default exclusion
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  console.log('🔍 [loadExclusions] Loaded exclusions from storage:', exclusions);
  return exclusions;
};

export const saveExclusions = (exclusions: ExclusionSettings): void => {
  const exclusionsToSave = {
    ...exclusions,
    updatedAt: new Date().toISOString(),
  };
  console.log('🔍 [saveExclusions] Saving exclusions to storage:', exclusionsToSave);
  saveToStorage(STORAGE_KEYS.EXCLUSIONS, exclusionsToSave);
};