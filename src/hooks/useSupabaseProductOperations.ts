import { Product, Material } from '@/types/warehouse';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface UseSupabaseProductOperationsProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setMaterials: React.Dispatch<React.SetStateAction<Material[]>>;
  refreshData: () => Promise<void>;
}

export const useSupabaseProductOperations = ({
  products,
  setProducts,
  setMaterials,
  refreshData,
}: UseSupabaseProductOperationsProps) => {
  
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

  return {
    addProduct,
    updateProduct,
    deleteProduct,
  };
};