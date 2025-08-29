import { Material, Movement, ShelfLocation, ShelfData } from '@/types/warehouse';

interface UseWarehouseUtilitiesProps {
  materials: Material[];
  movements: Movement[];
}

export const useWarehouseUtilities = ({
  materials,
  movements,
}: UseWarehouseUtilitiesProps) => {
  
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

  return {
    getMaterialsByShelf,
    getShelfData,
    searchMaterials,
  };
};