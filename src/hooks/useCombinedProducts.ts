import { useMemo } from 'react';
import { Product } from '@/types/warehouse';
import { useApiProducts } from './useApiProducts';

export interface CombinedProduct extends Product {
  source: 'local' | 'api';
  isFromApi?: boolean;
}

interface UseCombinedProductsReturn {
  combinedProducts: CombinedProduct[];
  localCount: number;
  apiCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useCombinedProducts = (localProducts: Product[]): UseCombinedProductsReturn => {
  const { apiProducts, loading, error, refresh } = useApiProducts();

  const combinedProducts = useMemo(() => {
    const combined: CombinedProduct[] = [];
    const seenKeys = new Set<string>();

    // Create a unique key for each product to avoid duplicates
    const createProductKey = (product: Product) => 
      `${product.modelo}_${product.acabamento}_${product.cor}_${product.comprimento}`;

    // Add local products first (they have priority)
    localProducts.forEach(product => {
      const key = createProductKey(product);
      if (!seenKeys.has(key)) {
        combined.push({
          ...product,
          source: 'local',
          isFromApi: false,
        });
        seenKeys.add(key);
      }
    });

    // Add API products that don't conflict with local ones
    apiProducts.forEach(product => {
      const key = createProductKey(product);
      if (!seenKeys.has(key)) {
        combined.push({
          ...product,
          source: 'api',
          isFromApi: true,
        });
        seenKeys.add(key);
      }
    });

    return combined.sort((a, b) => {
      // Sort by source (local first), then by modelo
      if (a.source !== b.source) {
        return a.source === 'local' ? -1 : 1;
      }
      return a.modelo.localeCompare(b.modelo);
    });
  }, [localProducts, apiProducts]);

  return {
    combinedProducts,
    localCount: localProducts.length,
    apiCount: apiProducts.length,
    loading,
    error,
    refresh,
  };
};