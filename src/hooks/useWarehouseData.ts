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
    console.log('useWarehouseData - Loading data from storage...');
    
    // Initialize unified system first
    initializeUnifiedSystem();
    
    const savedProducts = loadFromStorage(STORAGE_KEYS.PRODUCTS, mockProducts);
    let savedMaterials = loadFromStorage(STORAGE_KEYS.MATERIALS, mockMaterials);
    const savedMovements = loadFromStorage(STORAGE_KEYS.MOVEMENTS, mockMovements);
    
    // 🔄 Enhanced Recovery: Try unified system first, then legacy backup
    const shouldRecover = savedMaterials.length === 0 || 
                         JSON.stringify(savedMaterials) === JSON.stringify(mockMaterials);
    
    if (shouldRecover) {
      console.log('🔄 [useWarehouseData] Attempting material recovery...');
      
      // Try unified system first
      const unifiedMaterials = loadUnifiedMaterials();
      if (unifiedMaterials && unifiedMaterials.length > 0) {
        console.log(`🔄 [useWarehouseData] Unified system restored ${unifiedMaterials.length} materials`);
        savedMaterials = unifiedMaterials;
        saveToStorage(STORAGE_KEYS.MATERIALS, unifiedMaterials);
      } else {
        // Fallback to legacy backup system
        const backupMaterials = loadFromStorage(STORAGE_KEYS.MATERIALS_BACKUP, null);
        if (backupMaterials && Array.isArray(backupMaterials) && backupMaterials.length > 0) {
          console.log(`🔄 [useWarehouseData] Legacy backup restored ${backupMaterials.length} materials`);
          savedMaterials = backupMaterials;
          saveToStorage(STORAGE_KEYS.MATERIALS, backupMaterials);
          // Also save to unified system for future use
          saveUnifiedMaterials(backupMaterials, 'user');
        }
      }
    } else {
      // Check for material loss even if we have data
      const lossDetected = detectMaterialLoss(savedMaterials);
      if (lossDetected) {
        console.log('🚨 [useWarehouseData] Material loss detected - attempting recovery');
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

    // Migrate existing products to include familia if missing
    const migratedProducts = savedProducts.map((product: Product) => {
      if (!product.familia) {
        return { ...product, familia: 'Classicos' }; // Default familia for migration
      }
      return product;
    });

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
      saveToStorage(STORAGE_KEYS.MATERIALS, materials);
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