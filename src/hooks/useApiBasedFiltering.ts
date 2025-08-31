import { useMemo } from 'react';
import { Product } from '@/types/warehouse';

interface LocalFilters {
  modelo: string;
  comprimento: string;
  cor: string;
  acabamento: string;
}

interface UseApiBasedFilteringReturn {
  filteredProducts: Product[];
  filteredCount: number;
  totalLoadedCount: number;
}

export const useApiBasedFiltering = (
  products: Product[],
  filters: LocalFilters,
  searchQuery: string = ''
): UseApiBasedFilteringReturn => {
  const filteredProducts = useMemo(() => {
    console.log('🔍 [useApiBasedFiltering] Starting filter with:', {
      totalProducts: products.length,
      filters,
      searchQuery,
      hasActiveFilters: Object.values(filters).some(value => value && value !== 'all')
    });

    return products.filter(product => {
      // First apply search query filter
      const matchesSearch = !searchQuery || 
        (product.codigo && product.codigo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.descricao && product.descricao.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // If no filters are active, return all products that match search
      const hasActiveFilters = Object.values(filters).some(value => value && value !== 'all');
      if (!hasActiveFilters) return true;

      // Apply API-based filters using product properties
      const matchesModelo = filters.modelo === 'all' || 
        (product.modelo && product.modelo.toLowerCase().includes(filters.modelo.toLowerCase()));

      const matchesComprimento = filters.comprimento === 'all' || 
        (product.comprimento && String(product.comprimento).includes(filters.comprimento));

      const matchesCor = filters.cor === 'all' || 
        (product.cor && product.cor.toLowerCase().includes(filters.cor.toLowerCase()));

      const matchesAcabamento = filters.acabamento === 'all' || 
        (product.acabamento && product.acabamento.toLowerCase().includes(filters.acabamento.toLowerCase()));

      const matches = matchesModelo && matchesComprimento && matchesCor && matchesAcabamento;
      
      console.log('🔍 [useApiBasedFiltering] Filter matches for', product.codigo, ':', {
        modelo: { filter: filters.modelo, product: product.modelo, matches: matchesModelo },
        comprimento: { filter: filters.comprimento, product: product.comprimento, matches: matchesComprimento },
        cor: { filter: filters.cor, product: product.cor, matches: matchesCor },
        acabamento: { filter: filters.acabamento, product: product.acabamento, matches: matchesAcabamento },
        overallMatch: matches
      });

      return matches;
    });
  }, [products, filters, searchQuery]);

  return {
    filteredProducts,
    filteredCount: filteredProducts.length,
    totalLoadedCount: products.length
  };
};