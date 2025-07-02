import React, { createContext, useContext, useState, useEffect } from 'react';
import { Material, Product, Movement, ShelfData, ShelfLocation } from '@/types/warehouse';

interface WarehouseContextType {
  materials: Material[];
  products: Product[];
  movements: Movement[];
  selectedShelf: ShelfLocation | null;
  addMaterial: (material: Omit<Material, 'id'>) => void;
  removeMaterial: (materialId: string) => void;
  updateMaterial: (materialId: string, updates: Partial<Material>) => void;
  addMovement: (movement: Omit<Movement, 'id'>) => void;
  getMaterialsByShelf: (location: ShelfLocation) => Material[];
  getShelfData: (location: ShelfLocation) => ShelfData;
  searchMaterials: (query: { modelo?: string; acabamento?: string; comprimento?: number }) => Material[];
  setSelectedShelf: (location: ShelfLocation | null) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
  deleteProduct: (productId: string) => void;
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

// Storage keys
const STORAGE_KEYS = {
  PRODUCTS: 'warehouse-products',
  MATERIALS: 'warehouse-materials',
  MOVEMENTS: 'warehouse-movements',
};

// Mock data as fallback
const mockProducts: Product[] = [
  {
    id: '1',
    modelo: 'Perfil L',
    acabamento: 'Anodizado',
    cor: 'Prata',
    comprimento: 2000,
  },
  {
    id: '2',
    modelo: 'Perfil L',
    acabamento: 'Anodizado',
    cor: 'Preto',
    comprimento: 2000,
  },
  {
    id: '3',
    modelo: 'Perfil U',
    acabamento: 'Natural',
    cor: 'Alumínio',
    comprimento: 3000,
  },
];

const mockMaterials: Material[] = [
  {
    id: 'm1',
    productId: '1',
    product: mockProducts[0],
    pecas: 25,
    location: { estante: 'B', prateleira: 2 },
  },
  {
    id: 'm2',
    productId: '2',
    product: mockProducts[1],
    pecas: 8,
    location: { estante: 'C', prateleira: 1 },
  },
  {
    id: 'm3',
    productId: '3',
    product: mockProducts[2],
    pecas: 45,
    location: { estante: 'D', prateleira: 3 },
  },
  {
    id: 'm4',
    productId: '1',
    product: mockProducts[0],
    pecas: 3,
    location: { estante: 'F', prateleira: 1 },
  },
];

const mockMovements: Movement[] = [
  {
    id: 'mov1',
    materialId: 'm1',
    type: 'entrada',
    pecas: 30,
    norc: 'NORC001',
    date: '2024-01-15',
  },
  {
    id: 'mov2',
    materialId: 'm1',
    type: 'saida',
    pecas: 5,
    norc: 'NORC002',
    date: '2024-01-20',
  },
];

// Storage utilities
const loadFromStorage = (key: string, fallback: any) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

const saveToStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
};

export const WarehouseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [selectedShelf, setSelectedShelf] = useState<ShelfLocation | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedProducts = loadFromStorage(STORAGE_KEYS.PRODUCTS, mockProducts);
    const savedMaterials = loadFromStorage(STORAGE_KEYS.MATERIALS, mockMaterials);
    const savedMovements = loadFromStorage(STORAGE_KEYS.MOVEMENTS, mockMovements);

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
      saveToStorage(STORAGE_KEYS.MATERIALS, materials);
    }
  }, [materials]);

  useEffect(() => {
    if (movements.length > 0) {
      saveToStorage(STORAGE_KEYS.MOVEMENTS, movements);
    }
  }, [movements]);

  const addMaterial = (material: Omit<Material, 'id'>) => {
    const newMaterial: Material = {
      ...material,
      id: `m${Date.now()}`,
    };
    setMaterials(prev => [...prev, newMaterial]);
  };

  const removeMaterial = (materialId: string) => {
    setMaterials(prev => prev.filter(m => m.id !== materialId));
  };

  const updateMaterial = (materialId: string, updates: Partial<Material>) => {
    setMaterials(prev => prev.map(m => m.id === materialId ? { ...m, ...updates } : m));
  };

  const addMovement = (movement: Omit<Movement, 'id'>) => {
    const newMovement: Movement = {
      ...movement,
      id: `mov${Date.now()}`,
    };
    setMovements(prev => [...prev, newMovement]);
  };

  const getMaterialsByShelf = (location: ShelfLocation): Material[] => {
    return materials.filter(
      m => m.location.estante === location.estante && m.location.prateleira === location.prateleira
    );
  };

  const getShelfData = (location: ShelfLocation): ShelfData => {
    const shelfMaterials = getMaterialsByShelf(location);
    const shelfMovements = movements.filter(mov => 
      shelfMaterials.some(m => m.id === mov.materialId)
    );
    
    return {
      location,
      materials: shelfMaterials,
      movements: shelfMovements,
    };
  };

  const searchMaterials = (query: { modelo?: string; acabamento?: string; comprimento?: number }): Material[] => {
    return materials.filter(material => {
      const { product } = material;
      if (query.modelo && !product.modelo.toLowerCase().includes(query.modelo.toLowerCase())) {
        return false;
      }
      if (query.acabamento && !product.acabamento.toLowerCase().includes(query.acabamento.toLowerCase())) {
        return false;
      }
      if (query.comprimento && product.comprimento !== query.comprimento) {
        return false;
      }
      return true;
    });
  };

  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...product,
      id: `p${Date.now()}`,
    };
    setProducts(prev => [...prev, newProduct]);
  };

  const updateProduct = (productId: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, ...updates } : p));
  };

  const deleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    setMaterials(prev => prev.filter(m => m.productId !== productId));
  };

  return (
    <WarehouseContext.Provider value={{
      materials,
      products,
      movements,
      selectedShelf,
      addMaterial,
      removeMaterial,
      updateMaterial,
      addMovement,
      getMaterialsByShelf,
      getShelfData,
      searchMaterials,
      setSelectedShelf,
      addProduct,
      updateProduct,
      deleteProduct,
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