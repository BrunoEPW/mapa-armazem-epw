import React, { createContext, useContext, useState } from 'react';
import { Material, Product, Movement, ShelfData, ShelfLocation } from '@/types/warehouse';
import { useWarehouseData } from '@/hooks/useWarehouseData';
import { useWarehouseOperations } from '@/hooks/useWarehouseOperations';

interface WarehouseContextType {
  materials: Material[];
  products: Product[];
  movements: Movement[];
  selectedShelf: ShelfLocation | null;
  addMaterial: (material: Omit<Material, 'id'>) => Material;
  removeMaterial: (materialId: string) => void;
  updateMaterial: (materialId: string, updates: Partial<Material>) => void;
  addMovement: (movement: Omit<Movement, 'id'>) => void;
  getMaterialsByShelf: (location: ShelfLocation) => Material[];
  getShelfData: (location: ShelfLocation) => ShelfData;
  searchMaterials: (query: { familia?: string; modelo?: string; acabamento?: string; comprimento?: number }) => Material[];
  setSelectedShelf: (location: ShelfLocation | null) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
  deleteProduct: (productId: string) => void;
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

export const WarehouseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedShelf, setSelectedShelf] = useState<ShelfLocation | null>(null);
  
  const { materials, products, movements, setMaterials, setProducts, setMovements } = useWarehouseData();
  
  const operations = useWarehouseOperations({
    materials,
    products,
    movements,
    setMaterials,
    setProducts,
    setMovements,
  });

  return (
    <WarehouseContext.Provider value={{
      materials,
      products,
      movements,
      selectedShelf,
      setSelectedShelf,
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