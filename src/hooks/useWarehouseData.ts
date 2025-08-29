import { useState, useEffect } from 'react';
import { Material, Product, Movement } from '@/types/warehouse';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/storage';
import { mockProducts, mockMaterials, mockMovements } from '@/data/mock-data';

export const useWarehouseData = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    console.log('useWarehouseData - Loading data from storage...');
    const savedProducts = loadFromStorage(STORAGE_KEYS.PRODUCTS, mockProducts);
    let savedMaterials = loadFromStorage(STORAGE_KEYS.MATERIALS, mockMaterials);
    const savedMovements = loadFromStorage(STORAGE_KEYS.MOVEMENTS, mockMovements);
    
    // 🔄 Recovery: If no materials found, try to restore from backup
    if (savedMaterials.length === 0 || savedMaterials === mockMaterials) {
      console.log('🔄 [useWarehouseData] Attempting to restore materials from backup...');
      const backupMaterials = loadFromStorage(STORAGE_KEYS.MATERIALS_BACKUP, null);
      if (backupMaterials && Array.isArray(backupMaterials) && backupMaterials.length > 0) {
        console.log(`🔄 [useWarehouseData] Found ${backupMaterials.length} materials in backup - restoring`);
        savedMaterials = backupMaterials;
        // Save restored materials back to main storage
        saveToStorage(STORAGE_KEYS.MATERIALS, backupMaterials);
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