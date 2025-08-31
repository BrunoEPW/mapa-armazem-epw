import { useEffect } from 'react';
import { Product } from '@/types/warehouse';
import { updateProductDescriptions, isGenericDescription } from '@/utils/productDescriptionUpdater';

/**
 * Hook that automatically updates product descriptions when products change
 */
export const useProductDescriptionUpdater = (
  products: Product[],
  setProducts: (updater: (prev: Product[]) => Product[]) => void
) => {
  useEffect(() => {
    // Check if there are any products with generic descriptions
    const hasGenericDescriptions = products.some(product => 
      isGenericDescription(product.descricao || '')
    );
    
    if (hasGenericDescriptions) {
      console.log('🔄 Found products with generic descriptions, updating...');
      
      // Update products with enhanced descriptions
      const updatedProducts = updateProductDescriptions(products);
      
      // Check if any products were actually updated
      const hasChanges = updatedProducts.some((updated, index) => 
        updated.descricao !== products[index]?.descricao
      );
      
      if (hasChanges) {
        console.log('✅ Updated product descriptions automatically');
        
        // Update the products with enhanced descriptions
        setProducts(() => updatedProducts);
      }
    }
  }, [products.length]); // Only run when the number of products changes, not on every description update

  return null;
};