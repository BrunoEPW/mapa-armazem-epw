import { Product } from '@/types/warehouse';
import { generateProductDescription, enhanceProductDescription } from './productDescriptionGenerator';

/**
 * Updates all products with generic descriptions to use enhanced descriptions
 */
export const updateProductDescriptions = (products: Product[]): Product[] => {
  return products.map(product => {
    const currentDescription = product.descricao || '';
    
    // Check if description needs updating
    const needsUpdate = currentDescription.startsWith('Produto EPW') || 
                       currentDescription === 'Produto sem descrição' ||
                       currentDescription.startsWith('EPW ') ||
                       (currentDescription.startsWith('Produto ') && currentDescription.length < 25);
    
    if (needsUpdate) {
      const enhancedDescription = generateProductDescription({
        codigo: product.codigo,
        modelo: product.modelo,
        acabamento: product.acabamento,
        cor: product.cor,
        comprimento: product.comprimento,
        epwOriginalCode: product.codigo
      });
      
      console.log(`🔄 Updating product description: "${currentDescription}" → "${enhancedDescription}"`);
      
      return {
        ...product,
        descricao: enhancedDescription
      };
    }
    
    return product;
  });
};

/**
 * Gets the best description for a product, enhancing if needed
 */
export const getBestProductDescription = (product: Product): string => {
  const currentDescription = product.descricao || '';
  
  return enhanceProductDescription(currentDescription, {
    codigo: product.codigo,
    modelo: product.modelo,
    acabamento: product.acabamento,
    cor: product.cor,
    comprimento: product.comprimento,
    epwOriginalCode: product.codigo
  });
};

/**
 * Checks if a product description is generic and needs enhancement
 */
export const isGenericDescription = (description: string): boolean => {
  return description.startsWith('Produto EPW') || 
         description === 'Produto sem descrição' ||
         description.startsWith('EPW ') ||
         (description.startsWith('Produto ') && description.length < 25);
};