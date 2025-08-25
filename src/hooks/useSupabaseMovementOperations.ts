import { Movement } from '@/types/warehouse';
import { toast } from 'sonner';
import { config } from '@/lib/config';

interface UseSupabaseMovementOperationsProps {
  movements: Movement[];
  setMovements: React.Dispatch<React.SetStateAction<Movement[]>>;
}

export const useSupabaseMovementOperations = ({
  movements,
  setMovements,
}: UseSupabaseMovementOperationsProps) => {
  
  const addMovement = async (movement: Omit<Movement, 'id'>): Promise<void> => {
    console.log('📝 [addMovement] Adding movement:', movement);
    
    try {
      // Create movements locally since warehouse tables not available in current schema
      console.log('🔧 [addMovement] Creating movement locally - warehouse tables not available');
      
      const localMovement: Movement = {
        id: `local-movement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        materialId: movement.materialId,
        type: movement.type,
        pecas: movement.pecas,
        norc: movement.norc,
        date: movement.date,
      };

      setMovements(prev => [...prev, localMovement]);
      console.log('✅ [addMovement] Local movement created:', localMovement);
      
    } catch (error) {
      console.error('🔴 [addMovement] Error:', error);
      toast.error('Erro ao adicionar movimento');
      throw error;
    }
  };

  return {
    addMovement,
  };
};