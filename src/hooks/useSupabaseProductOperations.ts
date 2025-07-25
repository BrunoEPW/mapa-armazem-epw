import { Product, Material } from '@/types/warehouse';
import { supabase } from '@/integrations/supabase/client';
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
      console.log('=== SUPABASE ADD PRODUCT DEBUG ===');
      console.log('Input product:', JSON.stringify(product, null, 2));
      
      // Validate required fields
      const requiredFields = ['familia', 'modelo', 'acabamento', 'cor', 'comprimento'];
      for (const field of requiredFields) {
        if (!product[field]) {
          console.error(`Missing required field in product: ${field}`);
          throw new Error(`Campo obrigatório em falta: ${field}`);
        }
      }
      console.log('✓ Product validation passed');
      
      // Prepare data for Supabase insertion
      const supabaseData = {
        familia: String(product.familia),
        modelo: String(product.modelo),
        acabamento: String(product.acabamento),
        cor: String(product.cor),
        comprimento: String(product.comprimento), // Ensure string type
        foto: product.foto || null,
        created_by: 'system', // Default user for now
        updated_by: 'system',
      };
      
      console.log('Data prepared for Supabase:', JSON.stringify(supabaseData, null, 2));
      console.log('Inserting into Supabase products table...');
      
      const { data, error } = await supabase
        .from('products')
        .insert(supabaseData)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase insertion error:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw new Error(`Erro do Supabase: ${error.message}`);
      }

      console.log('✓ Supabase insertion successful:', data);

      const newProduct: Product = {
        id: data.id,
        familia: product.familia,
        modelo: product.modelo,
        acabamento: product.acabamento,
        cor: product.cor,
        comprimento: product.comprimento,
        foto: product.foto,
        // Preserve EPW fields if they exist
        ...(product.epwTipo && { epwTipo: product.epwTipo }),
        ...(product.epwCertificacao && { epwCertificacao: product.epwCertificacao }),
        ...(product.epwModelo && { epwModelo: product.epwModelo }),
        ...(product.epwComprimento && { epwComprimento: product.epwComprimento }),
        ...(product.epwCor && { epwCor: product.epwCor }),
        ...(product.epwAcabamento && { epwAcabamento: product.epwAcabamento }),
        ...(product.epwOriginalCode && { epwOriginalCode: product.epwOriginalCode }),
      };

      setProducts(prev => [...prev, newProduct]);
      console.log('✓ Product added to local state:', newProduct);
      toast.success('Produto adicionado com sucesso');
      
    } catch (error) {
      console.error('❌ Error in addProduct:', error);
      console.error('Full error details:', {
        message: error.message,
        stack: error.stack,
        productData: product
      });
      toast.error(`Erro ao adicionar produto: ${error.message}`);
      throw error;
    }
  };

  const updateProduct = async (productId: string, updates: Partial<Product>) => {
    try {
      // Convert comprimento to string if present
      const updateData = {
        ...updates,
        comprimento: updates.comprimento ? String(updates.comprimento) : undefined,
      };

      const { error } = await supabase
        .from('products')
        .update(updateData)
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