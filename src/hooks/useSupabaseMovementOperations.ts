import { Movement } from '@/types/warehouse';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface UseSupabaseMovementOperationsProps {
  movements: Movement[];
  setMovements: React.Dispatch<React.SetStateAction<Movement[]>>;
}

export const useSupabaseMovementOperations = ({
  movements,
  setMovements,
}: UseSupabaseMovementOperationsProps) => {
  
  const addMovement = async (movement: Omit<Movement, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('movements')
        .insert({
          material_id: movement.materialId,
          type: movement.type,
          pecas: movement.pecas,
          norc: movement.norc,
          date: movement.date,
        })
        .select()
        .single();

      if (error) throw error;

      const newMovement: Movement = {
        id: data.id,
        materialId: movement.materialId,
        type: movement.type,
        pecas: movement.pecas,
        norc: movement.norc,
        date: movement.date,
      };

      setMovements(prev => [...prev, newMovement]);
      
    } catch (error) {
      console.error('Error adding movement:', error);
      toast.error('Erro ao adicionar movimento');
    }
  };

  return {
    addMovement,
  };
};