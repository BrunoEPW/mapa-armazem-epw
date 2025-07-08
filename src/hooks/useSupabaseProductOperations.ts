import { Product, Material } from '@/types/warehouse';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
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
      console.log('Adding product:', product);
      
      // Check if Supabase is configured
      if (!isSupabaseConfigured) {
        console.log('Supabase not configured, using localStorage');
        
        // Use local storage fallback
        const newProduct: Product = {
          id: crypto.randomUUID(),
          familia: product.familia,
          modelo: product.modelo,
          acabamento: product.acabamento,
          cor: product.cor,
          comprimento: product.comprimento,
          foto: product.foto,
        };

        setProducts(prev => [...prev, newProduct]);
        
        // Save to localStorage
        const existingProducts = localStorage.getItem('warehouse-products');
        const products = existingProducts ? JSON.parse(existingProducts) : [];
        products.push(newProduct);
        localStorage.setItem('warehouse-products', JSON.stringify(products));
        
        console.log('Product added to localStorage:', newProduct);
        toast.success('Produto adicionado com sucesso (modo local)');
        return;
      }

      console.log('Adding product to Supabase...');
      const { data, error } = await supabase
        .from('products')
        .insert({
          familia: product.familia,
          modelo: product.modelo,
          acabamento: product.acabamento,
          cor: product.cor,
          comprimento: product.comprimento,
          foto: product.foto,
          created_by: 'system', // Default user for now
          updated_by: 'system',
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

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
      console.log('Product added to Supabase:', newProduct);
      toast.success('Produto adicionado com sucesso');
      
    } catch (error) {
      console.error('Error adding product:', error);
      
      // Fallback to local storage if Supabase fails
      console.log('Falling back to localStorage due to error');
      const newProduct: Product = {
        id: crypto.randomUUID(),
        familia: product.familia,
        modelo: product.modelo,
        acabamento: product.acabamento,
        cor: product.cor,
        comprimento: product.comprimento,
        foto: product.foto,
      };

      setProducts(prev => [...prev, newProduct]);
      
      // Save to localStorage
      const existingProducts = localStorage.getItem('warehouse-products');
      const products = existingProducts ? JSON.parse(existingProducts) : [];
      products.push(newProduct);
      localStorage.setItem('warehouse-products', JSON.stringify(products));
      
      toast.success('Produto adicionado com sucesso (modo local)');
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