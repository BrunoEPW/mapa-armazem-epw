import { Movement } from '@/types/warehouse';
import { supabase } from '@/integrations/supabase/client';
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
      // If using mock auth, create movements locally instead of trying Supabase
      if (config.auth.useMockAuth) {
        console.log('🔧 [addMovement] Mock auth mode - creating movement locally');
        
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
        return;
      }
      
      // Check if this is for a local material
      if (movement.materialId.startsWith('local-')) {
        console.log('⚠️ [addMovement] Detected local material, creating local movement');
        
        // Create local movement
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
        return;
      }

      // For database materials, try to insert into database
      console.log('💾 [addMovement] Inserting movement into Supabase...');
      
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

      if (error) {
        console.error('🔴 [addMovement] Supabase error:', error);
        
        // If database fails, create locally
        if (error.message?.includes('row-level security') || 
            error.code === '42501' ||
            error.code === '23503') { // Foreign key violation
          console.log('⚠️ [addMovement] Database restricted, creating local movement');
          
          const localMovement: Movement = {
            id: `local-movement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            materialId: movement.materialId,
            type: movement.type,
            pecas: movement.pecas,
            norc: movement.norc,
            date: movement.date,
          };

          setMovements(prev => [...prev, localMovement]);
          console.log('✅ [addMovement] Local movement created as fallback:', localMovement);
          return;
        }
        
        throw error;
      }

      console.log('✅ [addMovement] Database movement created:', data);

      const newMovement: Movement = {
        id: data.id,
        materialId: movement.materialId,
        type: movement.type,
        pecas: movement.pecas,
        norc: movement.norc,
        date: movement.date,
      };

      setMovements(prev => [...prev, newMovement]);
      console.log('✅ [addMovement] Movement added successfully');
      
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