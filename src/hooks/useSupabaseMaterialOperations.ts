import { Material, Product } from '@/types/warehouse';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useAuditLog } from '@/hooks/useAuditLog';
import { config } from '@/lib/config';
import { isValidUUID, ensureValidProductId } from '@/utils/uuidUtils';

interface UseSupabaseMaterialOperationsProps {
  materials: Material[];
  setMaterials: React.Dispatch<React.SetStateAction<Material[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

export const useSupabaseMaterialOperations = ({
  materials,
  setMaterials,
  products,
  setProducts,
}: UseSupabaseMaterialOperationsProps) => {
  const auth = useAuth();
  const { logAction } = useAuditLog();
  
  // Only access user/permissions when auth context is ready
  const user = auth?.user || null;
  
  const addMaterial = async (material: Omit<Material, 'id'>): Promise<Material> => {
    console.log('🔍 [addMaterial] Starting with material:', material);
    
    // Create materials locally since warehouse tables not available in current schema
    console.log('🔧 [addMaterial] Creating material locally - warehouse tables not available');
    
    const localMaterial: Material = {
      id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productId: material.productId,
      product: material.product,
      pecas: material.pecas,
      location: material.location,
    };

    setMaterials(prev => [...prev, localMaterial]);
    toast.success('Material adicionado com sucesso!');
    console.log('✅ [addMaterial] Local material created:', localMaterial);
    return localMaterial;
  };

  const removeMaterial = async (materialId: string) => {
    console.log('🗑️ [removeMaterial] Starting removal for material:', materialId);
    
    try {
      // Remove from local state only since warehouse tables not available
      setMaterials(prev => prev.filter(m => m.id !== materialId));
      
      toast.success('Material removido com sucesso!');
      console.log('✅ [removeMaterial] Material removed successfully');
      
    } catch (error) {
      console.error('🔴 [removeMaterial] Error:', error);
      toast.error('Erro ao remover material. Tente novamente.');
    }
  };

  const updateMaterial = async (materialId: string, updates: Partial<Material>): Promise<void> => {
    console.log('🔄 [updateMaterial] Starting update for material:', materialId, 'with updates:', updates);
    
    try {
      // Update local state only since warehouse tables not available
      setMaterials(prev => prev.map(m => 
        m.id === materialId ? { ...m, ...updates } : m
      ));
      
      toast.success('Material atualizado com sucesso!');
      console.log('✅ [updateMaterial] Material updated successfully');
      
    } catch (error) {
      console.error('🔴 [updateMaterial] Error:', error);
      toast.error('Erro ao atualizar material. Tente novamente.');
      throw error;
    }
  };

  return {
    addMaterial,
    removeMaterial,
    updateMaterial,
  };
};