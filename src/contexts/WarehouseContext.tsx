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

// Default operations for when auth is not ready
const defaultOperations = {
  addMaterial: async (): Promise<Material> => {
    throw new Error('Authentication required');
  },
  removeMaterial: async (): Promise<void> => {
    throw new Error('Authentication required');
  },
  updateMaterial: async (): Promise<void> => {
    throw new Error('Authentication required');
  },
  addMovement: async (): Promise<void> => {
    throw new Error('Authentication required');
  },
  getMaterialsByShelf: (): Material[] => [],
  getShelfData: (): ShelfData => ({ location: { estante: '', prateleira: 0, posicao: undefined }, materials: [], movements: [] }),
  searchMaterials: (): Material[] => [],
  addProduct: async (): Promise<void> => {
    throw new Error('Authentication required');
  },
  updateProduct: async (): Promise<void> => {
    throw new Error('Authentication required');
  },
  deleteProduct: async (): Promise<void> => {
    throw new Error('Authentication required');
  },
  clearAllData: async (): Promise<boolean> => {
    throw new Error('Authentication required');
  },
  clearAllMaterials: async (): Promise<boolean> => {
    throw new Error('Authentication required');
  },
};

export const WarehouseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // All useState calls first
  const [selectedShelf, setSelectedShelf] = useState<ShelfLocation | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  // Get auth state
  const auth = useAuth();
  const { loading: authLoading, isAuthenticated } = auth || { loading: true, isAuthenticated: false };
  
  // All hooks must be called consistently
  const { materials, products, movements, loading, setMaterials, setProducts, setMovements, refreshData } = useSupabaseWarehouseData();
  const { clearAllData } = useDataReset(setMaterials, setProducts, setMovements);
  
  // Conditional hook calls are causing the dispatcher error - we need to call all hooks unconditionally
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
  
  // useEffect for auth ready state
  useEffect(() => {
    if (!authLoading) {
      setIsAuthReady(true);
    }
  }, [authLoading]);

  const handleClearAllMaterials = async () => {
    if (!isAuthReady || !isAuthenticated) {
      throw new Error('Authentication required');
    }
    const success = await adminOps.clearAllMaterials();
    if (success) {
      // Refresh data to update the UI
      await refreshData();
    }
    return success;
  };

  return (
    <WarehouseContext.Provider value={{
      materials,
      products,
      movements,
      selectedShelf,
      loading: loading || authLoading || !isAuthReady,
      setSelectedShelf,
      clearAllData,
      clearAllMaterials: handleClearAllMaterials,
      ...operations,
    }}>
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