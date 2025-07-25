import React, { createContext, useContext, useState, useEffect } from 'react';
import { Material, Product, Movement, ShelfData, ShelfLocation } from '@/types/warehouse';

import { useSupabaseWarehouseData } from '@/hooks/useSupabaseWarehouseData';
import { useSupabaseWarehouseOperations } from '@/hooks/useSupabaseWarehouseOperations';
import { useRealTimeSync } from '@/hooks/useRealTimeSync';
import { useDataReset } from '@/hooks/useDataReset';
import { useSupabaseAdminOperations } from '@/hooks/useSupabaseAdminOperations';
import { useProductWebService } from '@/hooks/useProductWebService';

interface WarehouseContextType {
  materials: Material[];
  products: Product[];
  movements: Movement[];
  selectedShelf: ShelfLocation | null;
  loading: boolean;
  addMaterial: (material: Omit<Material, 'id'>) => Promise<Material>;
  removeMaterial: (materialId: string) => Promise<void>;
  updateMaterial: (materialId: string, updates: Partial<Material>) => Promise<void>;
  addMovement: (movement: Omit<Movement, 'id'>) => Promise<void>;
  getMaterialsByShelf: (location: ShelfLocation) => Material[];
  getShelfData: (location: ShelfLocation) => ShelfData;
  searchMaterials: (query: { familia?: string; modelo?: string; acabamento?: string; comprimento?: number }) => Material[];
  setSelectedShelf: (location: ShelfLocation | null) => void;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (productId: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  clearAllData: () => Promise<boolean>;
  clearAllMaterials: () => Promise<boolean>;
  createProductFromApi: (apiProduct: any) => Promise<Product>;
  syncProducts: () => Promise<boolean>;
  syncStatus: {
    isLoading: boolean;
    lastSync: Date | null;
    error: string | null;
    totalSynced: number;
  };
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

export const WarehouseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // All useState calls first
  const [selectedShelf, setSelectedShelf] = useState<ShelfLocation | null>(null);
  
  // No authentication required
  
  // All hooks must be called consistently
  const { materials, products, movements, loading, setMaterials, setProducts, setMovements, refreshData } = useSupabaseWarehouseData();
  const { clearAllData } = useDataReset(setMaterials, setProducts, setMovements);
  
  // Operations without auth checks for development
  const operations = useSupabaseWarehouseOperations({
    materials,
    products,
    movements,
    setMaterials,
    setProducts,
    setMovements,
    refreshData,
  });
  
  const adminOps = useSupabaseAdminOperations();
  const { syncStatus, syncProducts } = useProductWebService();
  
  // Enable real-time synchronization
  useRealTimeSync(refreshData, refreshData, refreshData);

  const createProductFromApi = async (apiProduct: any): Promise<Product> => {
    console.log('=== CREATE PRODUCT FROM API DEBUG ===');
    console.log('Input apiProduct:', apiProduct);
    
    // Generate a clean ID (remove api_ prefix if present)
    const cleanId = apiProduct.id.startsWith('api_') ? apiProduct.id.replace('api_', '') : apiProduct.id;
    
    // Create product data
    const newProduct: Omit<Product, 'id'> = {
      familia: apiProduct.familia,
      modelo: apiProduct.modelo,
      acabamento: apiProduct.acabamento,
      cor: apiProduct.cor,
      comprimento: apiProduct.comprimento,
      foto: apiProduct.foto,
      // Copy EPW fields if they exist
      epwTipo: apiProduct.epwTipo,
      epwCertificacao: apiProduct.epwCertificacao,
      epwModelo: apiProduct.epwModelo,
      epwComprimento: apiProduct.epwComprimento,
      epwCor: apiProduct.epwCor,
      epwAcabamento: apiProduct.epwAcabamento,
      epwOriginalCode: apiProduct.epwOriginalCode,
    };

    console.log('Product to create:', newProduct);

    try {
      // Add the product to Supabase
      console.log('Calling operations.addProduct...');
      await operations.addProduct(newProduct);
      console.log('Product added to Supabase successfully');
      
      // Return the product with the clean ID
      const resultProduct: Product = {
        id: cleanId,
        ...newProduct,
      };
      
      console.log('Returning product:', resultProduct);
      return resultProduct;
      
    } catch (error) {
      console.error('Error creating product from API:', error);
      throw error;
    }
  };

  const handleClearAllMaterials = async () => {
    // Skip auth checks in development mode
    const success = await adminOps.clearAllMaterials();
    if (success) {
      // Refresh data to update the UI
      await refreshData();
    }
    return success;
  };

  const contextValue: WarehouseContextType = {
    materials,
    products,
    movements,
    selectedShelf,
    loading,
    setSelectedShelf,
    clearAllData,
    clearAllMaterials: handleClearAllMaterials,
    createProductFromApi,
    syncProducts,
    syncStatus,
    ...operations,
  };

  return (
    <WarehouseContext.Provider value={contextValue}>
      {children}
    </WarehouseContext.Provider>
  );
};

export const useWarehouse = () => {
  const context = useContext(WarehouseContext);
  if (context === undefined) {
    throw new Error('useWarehouse must be used within a WarehouseProvider');
  }
  return context;
};