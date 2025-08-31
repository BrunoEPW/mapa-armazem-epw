import { useState, useEffect } from 'react';
import { Material, Product, Movement } from '@/types/warehouse';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/storage';
import { mockProducts, mockMaterials, mockMovements } from '@/data/mock-data';
import { 
  loadMaterials as loadUnifiedMaterials, 
  detectMaterialLoss, 
  saveMaterials as saveUnifiedMaterials,
  initializeUnifiedSystem 
} from '@/utils/unifiedMaterialManager';

export const useWarehouseData = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    console.log('🔧 [useWarehouseData] Starting data loading and recovery process...');
    
    // Initialize unified system first
    initializeUnifiedSystem();
    
    const savedProducts = loadFromStorage(STORAGE_KEYS.PRODUCTS, mockProducts);
    let savedMaterials = loadFromStorage(STORAGE_KEYS.MATERIALS, mockMaterials);
    const savedMovements = loadFromStorage(STORAGE_KEYS.MOVEMENTS, mockMovements);
    
    console.log('🔍 [useWarehouseData] Initial data check:', {
      products: savedProducts.length,
      materials: savedMaterials.length,
      movements: savedMovements.length
    });
    
    // 🚨 FORCE RECOVERY: Always attempt recovery if materials are missing or mock data
    const shouldRecover = savedMaterials.length === 0 || 
                         JSON.stringify(savedMaterials) === JSON.stringify(mockMaterials) ||
                         savedMaterials.every(m => m.id.startsWith('mock-'));
    
    if (shouldRecover) {
      console.log('🔄 [useWarehouseData] FORCING material recovery - data loss detected');
      
      // Try all recovery methods in sequence
      let recovered = false;
      
      // 1. Try unified system
      const unifiedMaterials = loadUnifiedMaterials();
      if (unifiedMaterials && unifiedMaterials.length > 0 && !unifiedMaterials.every(m => m.id.startsWith('mock-'))) {
        console.log(`✅ [useWarehouseData] Unified system restored ${unifiedMaterials.length} materials`);
        savedMaterials = unifiedMaterials;
        saveToStorage(STORAGE_KEYS.MATERIALS, unifiedMaterials);
        recovered = true;
      }
      
      // 2. Try legacy backup system
      if (!recovered) {
        const backupMaterials = loadFromStorage(STORAGE_KEYS.MATERIALS_BACKUP, null);
        if (backupMaterials && Array.isArray(backupMaterials) && backupMaterials.length > 0 && !backupMaterials.every(m => m.id.startsWith('mock-'))) {
          console.log(`✅ [useWarehouseData] Legacy backup restored ${backupMaterials.length} materials`);
          savedMaterials = backupMaterials;
          saveToStorage(STORAGE_KEYS.MATERIALS, backupMaterials);
          saveUnifiedMaterials(backupMaterials, 'user');
          recovered = true;
        }
      }
      
      // 3. Try session storage backup
      if (!recovered) {
        try {
          const sessionBackup = sessionStorage.getItem('materials_emergency_backup');
          if (sessionBackup) {
            const sessionMaterials = JSON.parse(sessionBackup);
            if (Array.isArray(sessionMaterials) && sessionMaterials.length > 0 && !sessionMaterials.every(m => m.id.startsWith('mock-'))) {
              console.log(`✅ [useWarehouseData] Session backup restored ${sessionMaterials.length} materials`);
              savedMaterials = sessionMaterials;
              saveToStorage(STORAGE_KEYS.MATERIALS, sessionMaterials);
              saveUnifiedMaterials(sessionMaterials, 'user');
              recovered = true;
            }
          }
        } catch (error) {
          console.error('❌ [useWarehouseData] Session backup failed:', error);
        }
      }
      
      if (!recovered) {
        console.log('❌ [useWarehouseData] All recovery attempts failed - using mock data');
      }
    } else {
      // Always check for material loss even if we have data
      const lossDetected = detectMaterialLoss(savedMaterials);
      if (lossDetected) {
        console.log('🚨 [useWarehouseData] Material loss detected during normal operation');
        const recovered = loadUnifiedMaterials();
        if (recovered && recovered.length > 0) {
          console.log(`🔄 [useWarehouseData] Recovered ${recovered.length} materials after loss detection`);
          savedMaterials = recovered;
          saveToStorage(STORAGE_KEYS.MATERIALS, recovered);
        }
      }
    }
    
    console.log('useWarehouseData - Loaded:', { 
      products: savedProducts.length, 
      materials: savedMaterials.length, 
      movements: savedMovements.length 
    });

    // No migration needed - familia removed
    const migratedProducts = savedProducts;

    setProducts(migratedProducts);
    setMaterials(savedMaterials);
    setMovements(savedMovements);
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    if (products.length > 0) {
      saveToStorage(STORAGE_KEYS.PRODUCTS, products);
    }
  }, [products]);

  useEffect(() => {
    if (materials.length > 0) {
      console.log(`💾 [useWarehouseData] Saving ${materials.length} materials to storage`);
      saveToStorage(STORAGE_KEYS.MATERIALS, materials);
      // Emergency session backup
      try {
        sessionStorage.setItem('materials_emergency_backup', JSON.stringify(materials));
      } catch (error) {
        console.error('❌ [useWarehouseData] Emergency backup failed:', error);
      }
      // Also save to unified system for preservation
      saveUnifiedMaterials(materials, 'user');
    }
  }, [materials]);

  useEffect(() => {
    if (movements.length > 0) {
      saveToStorage(STORAGE_KEYS.MOVEMENTS, movements);
    }
  }, [movements]);

  return {
    materials,
    products,
    movements,
    setMaterials,
    setProducts,
    setMovements,
  };
};