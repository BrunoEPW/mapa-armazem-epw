import { Material, Product, Movement, ShelfLocation, ShelfData } from '@/types/warehouse';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useAuditLog } from '@/hooks/useAuditLog';

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

  const addProduct = async (product: Omit<Product, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          familia: product.familia,
          modelo: product.modelo,
          acabamento: product.acabamento,
          cor: product.cor,
          comprimento: product.comprimento,
          foto: product.foto,
        })
        .select()
        .single();

      if (error) throw error;

      const newProduct: Product = {
        id: data.id,
        familia: product.familia,
        modelo: product.modelo,
        acabamento: product.acabamento,
        cor: product.cor,
        comprimento: product.comprimento,
        foto: product.foto,
      };

      setProducts(prev => [...prev, newProduct]);
      toast.success('Produto adicionado com sucesso');
      
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Erro ao adicionar produto');
    }
  };

  const updateProduct = async (productId: string, updates: Partial<Product>) => {
    try {
      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', productId);

      if (error) throw error;

      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, ...updates } : p
      ));

      // Refresh data to update materials with new product info
      await refreshData();
      toast.success('Produto atualizado com sucesso');
      
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Erro ao atualizar produto');
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      // First delete related materials
      const { error: materialsError } = await supabase
        .from('materials')
        .delete()
        .eq('product_id', productId);

      if (materialsError) throw materialsError;

      // Then delete the product
      const { error: productError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (productError) throw productError;

      setProducts(prev => prev.filter(p => p.id !== productId));
      setMaterials(prev => prev.filter(m => m.productId !== productId));
      toast.success('Produto eliminado com sucesso');
      
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Erro ao eliminar produto');
    }
  };

  // Keep existing functions that work with local state
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
