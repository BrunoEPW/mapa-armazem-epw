import React, { createContext, useContext, useState, useEffect } from 'react';
import { Material, Product, Movement, ShelfData, ShelfLocation } from '@/types/warehouse';
import { useAuth } from '@/contexts/AuthContext';
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
  
  // Get auth state - simplified for development mode
  const auth = useAuth();
  const { loading: authLoading } = auth || { loading: false };
  
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
    // Create product data without the 'api_' prefix
    const newProduct: Omit<Product, 'id'> = {
      familia: apiProduct.familia,
      modelo: apiProduct.modelo,
      acabamento: apiProduct.acabamento,
      cor: apiProduct.cor,
      comprimento: apiProduct.comprimento,
      foto: apiProduct.foto,
    };

    // Add the product (this updates the local state)
    await operations.addProduct(newProduct);
    
    // Find the newly created product in the local state
    // We need to wait a moment for the state to update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const createdProduct = products.find(p => 
      p.familia === newProduct.familia &&
      p.modelo === newProduct.modelo &&
      p.acabamento === newProduct.acabamento &&
      p.cor === newProduct.cor &&
      p.comprimento === newProduct.comprimento
    );

    if (!createdProduct) {
      throw new Error('Failed to create product from API');
    }

    return createdProduct;
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
    loading: loading || authLoading,
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