import { Material, Product } from '@/types/warehouse';

export interface CleanupResult {
  success: boolean;
  materialsRemoved: number;
  productsRemoved: number;
  totalPiecesRemoved: number;
  removedItems: {
    products: Product[];
    materials: Material[];
  };
}

/**
 * Identify if a product is from API or locally created
 */
export const isNonApiProduct = (product: Product): boolean => {
  // Check for local product ID pattern
  if (product.id.startsWith('local-product-')) {
    return true;
  }
  
  // Check for locally generated descriptions (pattern: "MODELO - COR - ACABAMENTO - COMPRIMENTO")
  if (product.descricao) {
    const localDescriptionPattern = /^[A-Z0-9]+ - [A-Z0-9]+ - [A-Z0-9]+ - \d+mm?$/;
    if (localDescriptionPattern.test(product.descricao)) {
      return true;
    }
  }
  
  // Check if it has EPW original code but lacks proper API fields
  if (product.epwOriginalCode && !product.codigo) {
    return true;
  }
  
  // Check if description is auto-generated from basic fields
  const autoGenDescription = `${product.modelo} - ${product.cor} - ${product.acabamento} - ${product.comprimento}mm`;
  if (product.descricao === autoGenDescription) {
    return true;
  }
  
  return false;
};

/**
 * Clean non-API products from a specific shelf
 */
export const cleanNonApiProductsFromShelf = (
  materials: Material[],
  products: Product[],
  estante: string,
  prateleira: number
): CleanupResult => {
  console.log(`🧹 Cleaning non-API products from shelf ${estante}${prateleira}`);
  
  const shelfMaterials = materials.filter(
    m => m.location.estante === estante && m.location.prateleira === prateleira
  );
  
  const nonApiMaterials: Material[] = [];
  const nonApiProducts: Product[] = [];
  let totalPiecesRemoved = 0;
  
  // Identify non-API materials in this shelf
  for (const material of shelfMaterials) {
    if (isNonApiProduct(material.product)) {
      nonApiMaterials.push(material);
      totalPiecesRemoved += material.pecas;
      
      // Add product to removal list if not already there
      if (!nonApiProducts.find(p => p.id === material.product.id)) {
        nonApiProducts.push(material.product);
      }
    }
  }
  
  console.log(`🔍 Found ${nonApiMaterials.length} non-API materials in shelf ${estante}${prateleira}`);
  console.log(`📦 Products to remove:`, nonApiProducts.map(p => `${p.modelo} - ${p.descricao || 'No description'}`));
  
  return {
    success: true,
    materialsRemoved: nonApiMaterials.length,
    productsRemoved: nonApiProducts.length,
    totalPiecesRemoved,
    removedItems: {
      products: nonApiProducts,
      materials: nonApiMaterials
    }
  };
};

/**
 * Clean all non-API products from all shelves
 */
export const cleanAllNonApiProducts = (
  materials: Material[],
  products: Product[]
): CleanupResult => {
  console.log('🧹 Starting global cleanup of non-API products');
  
  const nonApiProducts = products.filter(isNonApiProduct);
  const nonApiProductIds = new Set(nonApiProducts.map(p => p.id));
  
  const nonApiMaterials = materials.filter(m => nonApiProductIds.has(m.product.id));
  const totalPiecesRemoved = nonApiMaterials.reduce((sum, m) => sum + m.pecas, 0);
  
  console.log(`🔍 Global cleanup results:`);
  console.log(`  - Non-API products found: ${nonApiProducts.length}`);
  console.log(`  - Non-API materials found: ${nonApiMaterials.length}`);
  console.log(`  - Total pieces to remove: ${totalPiecesRemoved}`);
  
  // Log details of what will be removed
  nonApiProducts.forEach(product => {
    const productMaterials = nonApiMaterials.filter(m => m.product.id === product.id);
    const productPieces = productMaterials.reduce((sum, m) => sum + m.pecas, 0);
    console.log(`  📦 ${product.codigo || product.modelo}: ${productMaterials.length} locations, ${productPieces} pieces`);
  });
  
  return {
    success: true,
    materialsRemoved: nonApiMaterials.length,
    productsRemoved: nonApiProducts.length,
    totalPiecesRemoved,
    removedItems: {
      products: nonApiProducts,
      materials: nonApiMaterials
    }
  };
};

/**
 * Apply cleanup results to actual data
 */
export const applyCleanupResults = (
  materials: Material[],
  products: Product[],
  cleanupResult: CleanupResult
): { cleanedMaterials: Material[]; cleanedProducts: Product[] } => {
  const removedProductIds = new Set(cleanupResult.removedItems.products.map(p => p.id));
  const removedMaterialIds = new Set(cleanupResult.removedItems.materials.map(m => m.id));
  
  const cleanedMaterials = materials.filter(m => !removedMaterialIds.has(m.id));
  const cleanedProducts = products.filter(p => !removedProductIds.has(p.id));
  
  console.log(`✅ Cleanup applied:`);
  console.log(`  - Materials: ${materials.length} → ${cleanedMaterials.length} (removed ${materials.length - cleanedMaterials.length})`);
  console.log(`  - Products: ${products.length} → ${cleanedProducts.length} (removed ${products.length - cleanedProducts.length})`);
  
  return { cleanedMaterials, cleanedProducts };
};