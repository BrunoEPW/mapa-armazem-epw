import { useMemo } from 'react';
import { Product } from '@/types/warehouse';
import { decodeEPWReference } from '@/utils/epwCodeDecoder';
import { config } from '@/lib/config';

interface EPWFilters {
  modelo: string;
  comprimento: string;
  cor: string;
  acabamento: string;
}

interface UseEPWLocalFilteringReturn {
  filteredProducts: Product[];
  filteredCount: number;
  totalLoadedCount: number;
}

export const useEPWLocalFiltering = (
  products: Product[],
  filters: EPWFilters,
  searchQuery: string = ''
): UseEPWLocalFilteringReturn => {
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // First apply search query filter
      const matchesSearch = !searchQuery || 
        (product.epwOriginalCode && product.epwOriginalCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.codigo && product.codigo.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // If no EPW filters are active, return all products that match search
      const hasEPWFilters = Object.values(filters).some(value => value && value !== 'all');
      if (!hasEPWFilters) return true;

      // When EPW filters are active, ONLY accept products with valid EPW codes
      if (!product.epwOriginalCode) {
        if (config.isDevelopment) {
          console.log('Rejecting non-EPW product:', product.codigo);
        }
        return false;
      }

      // Apply EPW filters using local decoding
      const codigo = product.epwOriginalCode;
      if (!codigo) return false;

      const decoded = decodeEPWReference(codigo, config.isDevelopment);
      if (!decoded.success || !decoded.product) return false;

      const decodedProduct = decoded.product;

      // Check each filter
      const matchesModelo = filters.modelo === 'all' || 
        filters.modelo === decodedProduct.modelo.l ||
        filters.modelo === `${decodedProduct.modelo.l} - ${decodedProduct.modelo.d}`;

      const matchesComprimento = filters.comprimento === 'all' || 
        filters.comprimento === decodedProduct.comprim.l ||
        filters.comprimento === `${decodedProduct.comprim.l} - ${decodedProduct.comprim.d}`;

      const matchesCor = filters.cor === 'all' || 
        filters.cor === decodedProduct.cor.l ||
        filters.cor === `${decodedProduct.cor.l} - ${decodedProduct.cor.d}`;

      const matchesAcabamento = filters.acabamento === 'all' || 
        filters.acabamento === decodedProduct.acabamento.l ||
        filters.acabamento === `${decodedProduct.acabamento.l} - ${decodedProduct.acabamento.d}`;

      return matchesModelo && matchesComprimento && matchesCor && matchesAcabamento;
    });
  }, [products, filters, searchQuery]);

  return {
    filteredProducts,
    filteredCount: filteredProducts.length,
    totalLoadedCount: products.length
  };
};