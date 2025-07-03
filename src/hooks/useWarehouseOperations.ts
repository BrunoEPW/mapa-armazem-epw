import { Material, Product, Movement, ShelfLocation, ShelfData } from '@/types/warehouse';

interface UseWarehouseOperationsProps {
  materials: Material[];
  products: Product[];
  movements: Movement[];
  setMaterials: React.Dispatch<React.SetStateAction<Material[]>>;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setMovements: React.Dispatch<React.SetStateAction<Movement[]>>;
}

export const useWarehouseOperations = ({
  materials,
  products,
  movements,
  setMaterials,
  setProducts,
  setMovements,
}: UseWarehouseOperationsProps) => {
  const addMaterial = (material: Omit<Material, 'id'>) => {
    console.log('useWarehouseOperations - addMaterial called with:', material);
    const newMaterial: Material = {
      ...material,
      id: `m${Date.now()}`,
    };
    console.log('useWarehouseOperations - Created new material:', newMaterial);
    setMaterials(prev => {
      const updated = [...prev, newMaterial];
      console.log('useWarehouseOperations - Updated materials list, new length:', updated.length);
      return updated;
    });
    return newMaterial; // Return the new material so we can use its ID
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

  const searchMaterials = (query: { familia?: string; modelo?: string; acabamento?: string; comprimento?: number }): Material[] => {
    return materials.filter(material => {
      const { product } = material;
      if (query.familia && !product.familia.toLowerCase().includes(query.familia.toLowerCase())) {
        return false;
      }
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

  return {
    addMaterial,
    removeMaterial,
    updateMaterial,
    addMovement,
    getMaterialsByShelf,
    getShelfData,
    searchMaterials,
    addProduct,
    updateProduct,
    deleteProduct,
  };
};