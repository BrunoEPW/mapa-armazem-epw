/**
 * 🔧 Storage Reconciliation System
 * Unified material persistence with comprehensive recovery mechanisms
 */

import { Material } from '@/types/warehouse';
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from '@/lib/storage';
import { UNIFIED_KEYS } from './unifiedMaterialManager';

export interface StorageReconciliationResult {
  materials: Material[];
  source: string;
  success: boolean;
  recovered: boolean;
}

/**
 * Check if materials are real user data (not mock)
 */
const isRealUserData = (materials: Material[]): boolean => {
  if (!materials || materials.length === 0) return false;
  
  // Check for mock indicators
  const mockIndicators = [
    'mock-',
    'Ferro de 12mm A500 NR',
    'Ferro de 16mm A500 NR', 
    'Ferro de 20mm A500 NR'
  ];
  
  const hasMockData = materials.some(material => 
    mockIndicators.some(indicator => 
      material.id.includes(indicator) || 
      material.product.modelo.includes(indicator)
    )
  );
  
  // If has mock data and few materials, likely not real
  return !(hasMockData && materials.length <= 6);
};

/**
 * Migrate data from legacy keys to unified keys
 */
export const migrateStorageData = (): boolean => {
  console.log('🔄 [StorageReconciliation] Starting storage migration...');
  
  try {
    // Check if migration already done AND we have data
    const migrationFlag = localStorage.getItem('storage_migration_v2_completed');
    const hasPrimaryData = loadFromStorage(STORAGE_KEYS.MATERIALS, []).length > 0;
    
    if (migrationFlag && hasPrimaryData) {
      console.log('✅ [StorageReconciliation] Migration already completed and data exists');
      return true;
    }
    
    console.log(`🔄 [StorageReconciliation] Migration needed (flag: ${!!migrationFlag}, data: ${hasPrimaryData})`);
    
    // Find best materials data from any source
    const legacyMaterials = loadFromStorage(STORAGE_KEYS.MATERIALS, []);
    const backupMaterials = loadFromStorage(STORAGE_KEYS.MATERIALS_BACKUP, []);
    const unifiedMaterials = loadFromStorage(UNIFIED_KEYS.MATERIALS_PRIMARY, []);
    
    let bestMaterials: Material[] = [];
    let source = 'none';
    
    // Prefer real user data over mock data
    if (isRealUserData(legacyMaterials)) {
      bestMaterials = legacyMaterials;
      source = 'legacy';
    } else if (isRealUserData(backupMaterials)) {
      bestMaterials = backupMaterials;
      source = 'backup';
    } else if (isRealUserData(unifiedMaterials)) {
      bestMaterials = unifiedMaterials;
      source = 'unified';
    }
    
    if (bestMaterials.length > 0) {
      console.log(`🔄 [StorageReconciliation] Migrating ${bestMaterials.length} materials from ${source}`);
      
      // Save to all systems for maximum compatibility
      saveToStorage(STORAGE_KEYS.MATERIALS, bestMaterials);
      saveToStorage(STORAGE_KEYS.MATERIALS_BACKUP, bestMaterials);
      saveToStorage(UNIFIED_KEYS.MATERIALS_PRIMARY, bestMaterials);
      
      // Create unified metadata
      const metadata = {
        timestamp: Date.now(),
        count: bestMaterials.length,
        userSession: `migrated_${Date.now()}`,
        source: 'user',
        version: '2.0.0'
      };
      saveToStorage(UNIFIED_KEYS.MATERIALS_METADATA, metadata);
      
      // Emergency backups
      saveToStorage(STORAGE_KEYS.MATERIALS_EMERGENCY, bestMaterials);
      try {
        sessionStorage.setItem(STORAGE_KEYS.MATERIALS_SESSION, JSON.stringify(bestMaterials));
      } catch (e) {
        console.warn('Session storage backup failed:', e);
      }
    }
    
    // Mark migration as completed
    localStorage.setItem('storage_migration_v2_completed', 'true');
    console.log('✅ [StorageReconciliation] Migration completed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ [StorageReconciliation] Migration failed:', error);
    return false;
  }
};

/**
 * Comprehensive material recovery from all possible sources
 */
export const recoverMaterials = (): StorageReconciliationResult => {
  console.log('🔍 [StorageReconciliation] Starting comprehensive material recovery...');
  
  const sources = [
    { key: STORAGE_KEYS.MATERIALS, name: 'primary', storage: 'local' },
    { key: UNIFIED_KEYS.MATERIALS_PRIMARY, name: 'unified_primary', storage: 'local' },
    { key: STORAGE_KEYS.MATERIALS_BACKUP, name: 'backup', storage: 'local' },
    { key: UNIFIED_KEYS.MATERIALS_BACKUP, name: 'unified_backup', storage: 'local' },
    { key: STORAGE_KEYS.MATERIALS_EMERGENCY, name: 'emergency', storage: 'local' },
    { key: STORAGE_KEYS.MATERIALS_SESSION, name: 'session', storage: 'session' },
    { key: 'materials_emergency_backup', name: 'legacy_session', storage: 'session' }
  ];
  
  // First, let's debug what's actually in storage
  console.log('🔍 [StorageReconciliation] Debugging storage contents:');
  sources.forEach(source => {
    try {
      let data;
      if (source.storage === 'session') {
        data = sessionStorage.getItem(source.key);
      } else {
        data = localStorage.getItem(source.key);
      }
      console.log(`📦 [StorageReconciliation] ${source.name} (${source.key}):`, data ? `${data.length} chars` : 'null');
      
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            console.log(`  └── Array with ${parsed.length} items`);
          } else if (parsed && typeof parsed === 'object') {
            console.log(`  └── Object with keys:`, Object.keys(parsed));
          }
        } catch (e) {
          console.log(`  └── Failed to parse:`, e.message);
        }
      }
    } catch (e) {
      console.log(`❌ [StorageReconciliation] Error checking ${source.name}:`, e.message);
    }
  });
  
  for (const source of sources) {
    try {
      let materials: Material[] = [];
      
      if (source.storage === 'session') {
        const data = sessionStorage.getItem(source.key);
        if (data) {
          materials = JSON.parse(data);
        }
      } else {
        materials = loadFromStorage(source.key, []);
        
        // Handle unified backup format
        if (source.name.includes('unified_backup') && materials && typeof materials === 'object' && !Array.isArray(materials)) {
          materials = (materials as any).materials || [];
        }
      }
      
      console.log(`🔍 [StorageReconciliation] Checking ${source.name}: ${materials.length} materials`);
      
      // More lenient check - any materials that aren't obviously mock
      if (materials.length > 0) {
        const realMaterials = materials.filter(m => 
          m && 
          m.id && 
          !m.id.startsWith('mock-') &&
          m.product &&
          m.product.modelo
        );
        
        console.log(`🔍 [StorageReconciliation] ${source.name} has ${realMaterials.length} potentially real materials`);
        
        if (realMaterials.length > 0) {
          console.log(`✅ [StorageReconciliation] Recovered ${realMaterials.length} materials from ${source.name}`);
          
          // Save recovered data to all systems
          saveToStorage(STORAGE_KEYS.MATERIALS, realMaterials);
          saveToStorage(STORAGE_KEYS.MATERIALS_BACKUP, realMaterials);
          saveToStorage(UNIFIED_KEYS.MATERIALS_PRIMARY, realMaterials);
          
          return {
            materials: realMaterials,
            source: source.name,
            success: true,
            recovered: true
          };
        }
      }
      
    } catch (error) {
      console.warn(`⚠️ [StorageReconciliation] Error checking ${source.name}:`, error);
    }
  }
  
  console.log('❌ [StorageReconciliation] No recoverable materials found in any source');
  return {
    materials: [],
    source: 'none',
    success: false,
    recovered: false
  };
};

/**
 * Smart material saving with multiple backup strategies
 */
export const saveMaterialsSmart = (materials: Material[], source: 'user' | 'mock' | 'api' = 'user'): void => {
  if (!isRealUserData(materials) && source === 'user') {
    console.log('🔍 [StorageReconciliation] Skipping save - appears to be mock data');
    return;
  }
  
  console.log(`💾 [StorageReconciliation] Smart saving ${materials.length} materials (${source})`);
  
  try {
    // Save to all primary locations
    saveToStorage(STORAGE_KEYS.MATERIALS, materials);
    saveToStorage(STORAGE_KEYS.MATERIALS_BACKUP, materials);
    saveToStorage(UNIFIED_KEYS.MATERIALS_PRIMARY, materials);
    
    // Create unified metadata
    const metadata = {
      timestamp: Date.now(),
      count: materials.length,
      userSession: `session_${Date.now()}`,
      source,
      version: '2.0.0'
    };
    saveToStorage(UNIFIED_KEYS.MATERIALS_METADATA, metadata);
    
    // Emergency backups
    saveToStorage(STORAGE_KEYS.MATERIALS_EMERGENCY, materials);
    
    try {
      sessionStorage.setItem(STORAGE_KEYS.MATERIALS_SESSION, JSON.stringify(materials));
      sessionStorage.setItem('materials_emergency_backup', JSON.stringify(materials));
    } catch (e) {
      console.warn('Session storage backup failed:', e);
    }
    
    console.log(`✅ [StorageReconciliation] Materials saved successfully to all locations`);
    
  } catch (error) {
    console.error('❌ [StorageReconciliation] Failed to save materials:', error);
  }
};

/**
 * Check backup availability across all systems
 */
export const checkBackupAvailability = (): { available: boolean; sources: string[] } => {
  const sources = [];
  
  if (loadFromStorage(STORAGE_KEYS.MATERIALS_BACKUP, []).length > 0) sources.push('legacy_backup');
  if (loadFromStorage(UNIFIED_KEYS.MATERIALS_PRIMARY, []).length > 0) sources.push('unified_primary');
  if (loadFromStorage(UNIFIED_KEYS.MATERIALS_BACKUP, []).length > 0) sources.push('unified_backup');
  if (loadFromStorage(STORAGE_KEYS.MATERIALS_EMERGENCY, []).length > 0) sources.push('emergency');
  
  try {
    if (sessionStorage.getItem(STORAGE_KEYS.MATERIALS_SESSION)) sources.push('session');
    if (sessionStorage.getItem('materials_emergency_backup')) sources.push('legacy_session');
  } catch (e) {
    // Session storage not available
  }
  
  return {
    available: sources.length > 0,
    sources
  };
};

/**
 * Initialize storage reconciliation system
 */
export const initializeStorageReconciliation = (): void => {
  console.log('🔧 [StorageReconciliation] Initializing storage reconciliation system...');
  
  // Run migration first
  migrateStorageData();
  
  console.log('✅ [StorageReconciliation] Storage reconciliation system initialized');
};