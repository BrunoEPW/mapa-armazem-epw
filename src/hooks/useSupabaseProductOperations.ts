import { Product, Material } from '@/types/warehouse';
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
      console.log('🔵 Input product:', JSON.stringify(product, null, 2));
      console.log('🔵 Starting field validation...');
      
      // Validate required fields
      const requiredFields = ['familia', 'modelo', 'acabamento', 'cor', 'comprimento'];
      for (const field of requiredFields) {
        console.log(`🔵 Validating field "${field}":`, product[field]);
        if (!product[field]) {
          console.error(`🔴 Missing required field in product: ${field}`);
          throw new Error(`Campo obrigatório em falta: ${field}`);
        }
      }
      console.log('🔵 ✓ Product validation passed');
      
      // Create product locally since warehouse tables not available in current schema
      console.log('⚠️ Products table not available - adding product locally as fallback');
      
      // Create product locally with generated ID
      const newProduct: Product = {
        id: crypto.randomUUID(),
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
      console.log('✅ Product added to local state:', newProduct);
      
      toast.success('Produto adicionado com sucesso!');
      
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
      // Update locally since warehouse tables not available
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, ...updates } : p
      ));

      toast.success('Produto atualizado com sucesso');
      
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Erro ao atualizar produto');
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      // Delete locally since warehouse tables not available
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