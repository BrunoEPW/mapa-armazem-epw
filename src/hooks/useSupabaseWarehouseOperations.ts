import { Material, Product, Movement, ShelfLocation, ShelfData } from '@/types/warehouse';
import { useSupabaseMaterialOperations } from './useSupabaseMaterialOperations';
import { useSupabaseProductOperations } from './useSupabaseProductOperations';
import { useSupabaseMovementOperations } from './useSupabaseMovementOperations';
import { useWarehouseUtilities } from './useWarehouseUtilities';

interface UseSupabaseWarehouseOperationsProps {
  materials: Material[];
  products: Product[];
  movements: Movement[];
  setMaterials: React.Dispatch<React.SetStateAction<Material[]>>;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setMovements: React.Dispatch<React.SetStateAction<Movement[]>>;
  refreshData: () => Promise<void>;
}

export const useSupabaseWarehouseOperations = ({
  materials,
  products,
  movements,
  setMaterials,
  setProducts,
  setMovements,
  refreshData,
}: UseSupabaseWarehouseOperationsProps) => {
  
  const materialOperations = useSupabaseMaterialOperations({
    materials,
    setMaterials,
    products,
    setProducts,
  });

  const productOperations = useSupabaseProductOperations({
    products,
    setProducts,
    setMaterials,
    refreshData,
  });

  const movementOperations = useSupabaseMovementOperations({
    movements,
    setMovements,
  });

  const utilities = useWarehouseUtilities({
    materials,
    movements,
  });

  return {
    ...materialOperations,
    ...productOperations,
    ...movementOperations,
    ...utilities,
  };
};
