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
import { 
  initializeStorageReconciliation,
  recoverMaterials,
  saveMaterialsSmart,
  checkBackupAvailability
} from '@/utils/storageReconciliation';

export const useWarehouseData = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    console.log('🔧 [useWarehouseData] Starting enhanced data loading and recovery process...');
    
    // Initialize all systems
    initializeUnifiedSystem();
    initializeStorageReconciliation();
    
    const savedProducts = loadFromStorage(STORAGE_KEYS.PRODUCTS, mockProducts);
    let savedMaterials = loadFromStorage(STORAGE_KEYS.MATERIALS, mockMaterials);
    const savedMovements = loadFromStorage(STORAGE_KEYS.MOVEMENTS, mockMovements);
    
    console.log('🔍 [useWarehouseData] Initial data check:', {
      products: savedProducts.length,
      materials: savedMaterials.length,
      movements: savedMovements.length
    });
    
    // Check backup availability across all systems
    const backupStatus = checkBackupAvailability();
    console.log('🔍 [useWarehouseData] Backup availability:', backupStatus);
    
    // Enhanced recovery logic - check if we need to recover
    const needsRecovery = savedMaterials.length === 0 || 
                         JSON.stringify(savedMaterials) === JSON.stringify(mockMaterials) ||
                         savedMaterials.every(m => m.id.startsWith('mock-'));
    
    if (needsRecovery) {
      console.log('🔄 [useWarehouseData] Material recovery needed - attempting comprehensive recovery...');
      
      const recoveryResult = recoverMaterials();
      
      if (recoveryResult.success) {
        console.log(`✅ [useWarehouseData] Recovery successful: ${recoveryResult.materials.length} materials from ${recoveryResult.source}`);
        savedMaterials = recoveryResult.materials;
      } else {
        console.log('❌ [useWarehouseData] All recovery attempts failed - falling back to mock data');
        // Use mock data as last resort
        savedMaterials = mockMaterials;
      }
    } else {
      // Even if we have data, check for potential loss
      const lossDetected = detectMaterialLoss(savedMaterials);
      if (lossDetected) {
        console.log('🚨 [useWarehouseData] Material loss detected - attempting recovery...');
        const recoveryResult = recoverMaterials();
        if (recoveryResult.success) {
          console.log(`🔄 [useWarehouseData] Loss recovery successful: ${recoveryResult.materials.length} materials`);
          savedMaterials = recoveryResult.materials;
        }
      }
    }
    
    console.log('✅ [useWarehouseData] Final data loaded:', { 
      products: savedProducts.length, 
      materials: savedMaterials.length, 
      movements: savedMovements.length 
    });

    setProducts(savedProducts);
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
      console.log(`💾 [useWarehouseData] Smart saving ${materials.length} materials`);
      // Use the enhanced smart saving system
      saveMaterialsSmart(materials, 'user');
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