// 🔒 CRITICAL: Storage utilities for warehouse data management
// ⚠️ NEVER modify storage keys - data persistence depends on them
// 🔒 See EPW_EXCEPTIONS.md for EPW exceptions documentation

export const STORAGE_KEYS = {
  PRODUCTS: 'warehouse-products',
  MATERIALS: 'warehouse-materials',
  MOVEMENTS: 'warehouse-movements',
  EXCLUSIONS: 'product-exclusions',
  // 🔒 CRITICAL BACKUP KEYS - DO NOT MODIFY
  MATERIALS_BACKUP: 'warehouse-materials-backup',
  PRODUCTS_BACKUP: 'warehouse-products-backup',
  MOVEMENTS_BACKUP: 'warehouse-movements-backup',
  MATERIALS_PRESERVE: 'warehouse-materials-preserve',
  BACKUP_METADATA: 'warehouse-backup-metadata',
  
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
  // 🔒 CRITICAL: Load existing exclusions from storage - NEVER reset user data
  // This function MUST preserve all user-configured exclusions across app updates
  const stored = loadFromStorage(STORAGE_KEYS.EXCLUSIONS, null);
  
  if (stored && stored.prefixes) {
    // User has existing exclusions - preserve them completely
    console.log('🔍 [loadExclusions] Preserving existing user exclusions:', stored.prefixes);
    return {
      ...stored,
      updatedAt: stored.updatedAt || new Date().toISOString(),
    };
  }
  
  // First time setup only - default exclusions
  const defaultExclusions = {
    enabled: true,
    prefixes: ['ZZZ'], // Default exclusion only for new users
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  console.log('🔍 [loadExclusions] Creating default exclusions for new user:', defaultExclusions);
  return defaultExclusions;
};

export const saveExclusions = (exclusions: ExclusionSettings): void => {
  const exclusionsToSave = {
    ...exclusions,
    updatedAt: new Date().toISOString(),
  };
  console.log('🔍 [saveExclusions] Saving exclusions to storage:', exclusionsToSave);
  saveToStorage(STORAGE_KEYS.EXCLUSIONS, exclusionsToSave);
};

// 🔒 CRITICAL: Material preservation system - prevents data loss during updates
export interface BackupMetadata {
  version: string;
  createdAt: string;
  preserveMaterials: boolean;
  lastBackup: string;
  backupCount: number;
}

export const createBackup = (materials: any[], products: any[], movements: any[]): void => {
  try {
    console.log('🔒 [createBackup] Creating backup of all warehouse data');
    
    // Create backup with timestamp
    const timestamp = new Date().toISOString();
    saveToStorage(STORAGE_KEYS.MATERIALS_BACKUP, materials);
    saveToStorage(STORAGE_KEYS.PRODUCTS_BACKUP, products);
    saveToStorage(STORAGE_KEYS.MOVEMENTS_BACKUP, movements);
    
    // Update backup metadata
    const metadata: BackupMetadata = {
      version: '1.0.0',
      createdAt: timestamp,
      preserveMaterials: true,
      lastBackup: timestamp,
      backupCount: (loadFromStorage(STORAGE_KEYS.BACKUP_METADATA, { backupCount: 0 }) as any).backupCount + 1,
    };
    
    saveToStorage(STORAGE_KEYS.BACKUP_METADATA, metadata);
    console.log('✅ [createBackup] Backup created successfully', metadata);
  } catch (error) {
    console.error('❌ [createBackup] Failed to create backup:', error);
  }
};

export const restoreFromBackup = (): { materials: any[]; products: any[]; movements: any[] } | null => {
  try {
    console.log('🔄 [restoreFromBackup] Attempting to restore from backup');
    
    const materials = loadFromStorage(STORAGE_KEYS.MATERIALS_BACKUP, []);
    const products = loadFromStorage(STORAGE_KEYS.PRODUCTS_BACKUP, []);
    const movements = loadFromStorage(STORAGE_KEYS.MOVEMENTS_BACKUP, []);
    const metadata = loadFromStorage(STORAGE_KEYS.BACKUP_METADATA, null);
    
    if (!metadata) {
      console.log('ℹ️ [restoreFromBackup] No backup metadata found');
      return null;
    }
    
    console.log('✅ [restoreFromBackup] Backup restored successfully', {
      materialsCount: materials.length,
      productsCount: products.length,
      movementsCount: movements.length,
      metadata
    });
    
    return { materials, products, movements };
  } catch (error) {
    console.error('❌ [restoreFromBackup] Failed to restore backup:', error);
    return null;
  }
};

export const shouldPreserveMaterials = (): boolean => {
  const preserveFlag = loadFromStorage(STORAGE_KEYS.MATERIALS_PRESERVE, true);
  console.log('🔍 [shouldPreserveMaterials] Preserve materials flag:', preserveFlag);
  return preserveFlag;
};

export const setMaterialsPreservation = (preserve: boolean): void => {
  console.log('🔧 [setMaterialsPreservation] Setting materials preservation:', preserve);
  saveToStorage(STORAGE_KEYS.MATERIALS_PRESERVE, preserve);
};