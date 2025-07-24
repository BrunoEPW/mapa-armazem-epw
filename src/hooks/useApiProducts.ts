import { useState, useEffect, useRef } from 'react';
import { Product } from '@/types/warehouse';
import { apiService } from '@/services/apiService';
import { config } from '@/lib/config';

interface UseApiProductsReturn {
  apiProducts: Product[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useApiProducts = (): UseApiProductsReturn => {
  const [apiProducts, setApiProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const mapApiProductToProduct = (apiProduct: any): Product => ({
    id: `api_${apiProduct.id}`,
    familia: apiProduct.familia || '',
    modelo: apiProduct.modelo || '',
    acabamento: apiProduct.acabamento || '',
    cor: apiProduct.cor || '',
    comprimento: apiProduct.comprimento || 0,
    foto: apiProduct.foto || undefined,
  });

  const fetchApiProducts = async () => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      const apiData = await apiService.fetchAllArtigos();
      const mappedProducts = apiData.map(mapApiProductToProduct);
      
      setApiProducts(mappedProducts);
      
      if (config.isDevelopment) {
        console.log(`Loaded ${mappedProducts.length} products from API`);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError('Erro ao carregar produtos da API');
        console.error('Failed to fetch API products:', err);
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  useEffect(() => {
    fetchApiProducts();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    apiProducts,
    loading,
    error,
    refresh: fetchApiProducts,
  };
};