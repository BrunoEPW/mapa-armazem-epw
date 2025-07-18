import React, { createContext, useContext, useState, useEffect } from 'react';
import { Material, Product, Movement, ShelfData, ShelfLocation } from '@/types/warehouse';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseWarehouseData } from '@/hooks/useSupabaseWarehouseData';
import { useSupabaseWarehouseOperations } from '@/hooks/useSupabaseWarehouseOperations';
import { useRealTimeSync } from '@/hooks/useRealTimeSync';
import { useDataReset } from '@/hooks/useDataReset';
import { useSupabaseAdminOperations } from '@/hooks/useSupabaseAdminOperations';

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
  
  // Enable real-time synchronization
  useRealTimeSync(refreshData, refreshData, refreshData);

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