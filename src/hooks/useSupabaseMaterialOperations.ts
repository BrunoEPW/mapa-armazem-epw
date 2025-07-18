import { Material } from '@/types/warehouse';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useAuditLog } from '@/hooks/useAuditLog';

interface UseSupabaseMaterialOperationsProps {
  materials: Material[];
  setMaterials: React.Dispatch<React.SetStateAction<Material[]>>;
}

export const useSupabaseMaterialOperations = ({
  materials,
  setMaterials,
}: UseSupabaseMaterialOperationsProps) => {
  const { user, hasPermission } = useAuth();
  const { logAction } = useAuditLog();
  
  const addMaterial = async (material: Omit<Material, 'id'>) => {
    if (!hasPermission('canCreate')) {
      toast.error('Não tem permissão para adicionar materiais');
      throw new Error('Permission denied');
    }

    if (!user) {
      toast.error('Utilizador não autenticado');
      throw new Error('User not authenticated');
    }

    try {
      console.log('Adding material to Supabase:', material);
      
      const { data, error } = await supabase
        .from('materials')
        .insert({
          product_id: material.productId,
          pecas: material.pecas,
          estante: material.location.estante,
          prateleira: material.location.prateleira,
          posicao: material.location.posicao,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      const newMaterial: Material = {
        id: data.id,
        productId: material.productId,
        product: material.product,
        pecas: material.pecas,
        location: material.location,
      };

      // Log the action
      await logAction('materials', data.id, 'INSERT', undefined, {
        product_id: material.productId,
        pecas: material.pecas,
        location: material.location,
      });

      setMaterials(prev => [...prev, newMaterial]);
      console.log('Material added successfully:', newMaterial);
      toast.success('Material adicionado com sucesso');
      return newMaterial;
      
    } catch (error) {
      console.error('Error adding material:', error);
      toast.error('Erro ao adicionar material');
      throw error;
    }
  };

  const removeMaterial = async (materialId: string) => {
    try {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', materialId);

      if (error) throw error;

      setMaterials(prev => prev.filter(m => m.id !== materialId));
      toast.success('Material removido com sucesso');
      
    } catch (error) {
      console.error('Error removing material:', error);
      toast.error('Erro ao remover material');
    }
  };

  const updateMaterial = async (materialId: string, updates: Partial<Material>) => {
    try {
      const updateData: any = {};
      
      if (updates.pecas !== undefined) updateData.pecas = updates.pecas;
      if (updates.location) {
        updateData.estante = updates.location.estante;
        updateData.prateleira = updates.location.prateleira;
        updateData.posicao = updates.location.posicao;
      }

      const { error } = await supabase
        .from('materials')
        .update(updateData)
        .eq('id', materialId);

      if (error) throw error;

      setMaterials(prev => prev.map(m => 
        m.id === materialId ? { ...m, ...updates } : m
      ));
      
    } catch (error) {
      console.error('Error updating material:', error);
      toast.error('Erro ao atualizar material');
    }
  };

  return {
    addMaterial,
    removeMaterial,
    updateMaterial,
  };
};