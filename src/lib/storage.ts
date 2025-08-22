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
  console.log('🔍 [loadExclusions] Starting exclusions load process...');
  
  // 🚨 EMERGENCY FIX: Check if we're in an emergency state with too many exclusions
  // Try multiple backup keys for maximum reliability
  const backupKeys = [
    STORAGE_KEYS.EXCLUSIONS,
    `${STORAGE_KEYS.EXCLUSIONS}-backup-1`,
    `${STORAGE_KEYS.EXCLUSIONS}-backup-2`
  ];
  
  let stored = null;
  let recoveredFromBackup = false;
  
  for (const key of backupKeys) {
    try {
      const data = loadFromStorage(key, null);
      if (data && typeof data === 'object' && Array.isArray(data.prefixes)) {
        console.log(`🔍 [loadExclusions] Found valid exclusions in key: ${key}`);
        stored = data;
        recoveredFromBackup = key !== STORAGE_KEYS.EXCLUSIONS;
        break;
      }
    } catch (error) {
      console.warn(`🔍 [loadExclusions] Failed to load from ${key}:`, error);
    }
  }
  
  if (stored && Array.isArray(stored.prefixes)) {
    // 🚨 EMERGENCY FIX: If there are too many exclusions, reset to safe defaults
    const prefixCount = stored.prefixes.length;
    const tooManyExclusions = prefixCount > 10; // More than 10 prefixes is suspicious
    
    if (tooManyExclusions) {
      console.warn(`🚨 [loadExclusions] EMERGENCY: Too many exclusions detected (${prefixCount}), resetting to safe defaults!`);
      console.warn(`🚨 [loadExclusions] Problematic prefixes:`, stored.prefixes);
      
      // Create backup of problematic exclusions
      saveToStorage(`${STORAGE_KEYS.EXCLUSIONS}-emergency-backup`, stored);
      
      // Reset to safe defaults
      const emergencyDefaults = {
        enabled: true,
        prefixes: ['ZZZ'], // Only safe default
        createdAt: stored.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      console.log('🚨 [loadExclusions] Applying emergency reset:', emergencyDefaults);
      saveExclusions(emergencyDefaults);
      return emergencyDefaults;
    }
    
    // Normal case - preserve existing exclusions
    console.log('🔍 [loadExclusions] Preserving existing user exclusions:', {
      prefixes: stored.prefixes,
      enabled: stored.enabled,
      recoveredFromBackup,
      backupUsed: recoveredFromBackup ? 'YES' : 'NO'
    });
    
    const validExclusions = {
      enabled: typeof stored.enabled === 'boolean' ? stored.enabled : true,
      prefixes: stored.prefixes.filter(p => typeof p === 'string' && p.trim().length > 0),
      createdAt: stored.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // If recovered from backup, save to main key
    if (recoveredFromBackup) {
      console.log('🔄 [loadExclusions] Restoring from backup to main storage');
      saveExclusions(validExclusions);
    }
    
    return validExclusions;
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
  try {
    const exclusionsToSave = {
      ...exclusions,
      updatedAt: new Date().toISOString(),
    };
    
    console.log('🔍 [saveExclusions] Saving exclusions with multiple backups:', exclusionsToSave);
    
    // Save to main storage
    saveToStorage(STORAGE_KEYS.EXCLUSIONS, exclusionsToSave);
    
    // Create multiple backups for reliability
    saveToStorage(`${STORAGE_KEYS.EXCLUSIONS}-backup-1`, exclusionsToSave);
    saveToStorage(`${STORAGE_KEYS.EXCLUSIONS}-backup-2`, exclusionsToSave);
    
    // Verify the save was successful
    const verification = loadFromStorage(STORAGE_KEYS.EXCLUSIONS, null);
    if (!verification || !Array.isArray(verification.prefixes)) {
      console.error('❌ [saveExclusions] Save verification failed!');
      throw new Error('Failed to verify exclusions save');
    }
    
    console.log('✅ [saveExclusions] Exclusions saved and verified successfully');
  } catch (error) {
    console.error('❌ [saveExclusions] Failed to save exclusions:', error);
    // Try to save to backup location if main fails
    try {
      saveToStorage(`${STORAGE_KEYS.EXCLUSIONS}-emergency`, exclusions);
      console.log('🆘 [saveExclusions] Saved to emergency backup');
    } catch (emergencyError) {
      console.error('❌ [saveExclusions] Emergency backup also failed:', emergencyError);
    }
  }
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