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

  const mapApiProductToProduct = (apiProduct: any): Product => {
    // Parse the description to extract familia, modelo, acabamento, cor and comprimento
    const description = apiProduct.strDescricao || '';
    
    // Basic parsing - you may need to adjust this based on actual data patterns
    const parts = description.split(' ');
    const familia = parts[0] || 'API';
    const modelo = parts.slice(1, 3).join(' ') || apiProduct.strCodigo || '';
    const acabamento = 'Standard';
    const cor = 'Natural';
    const comprimento = 2000; // Default value
    
    return {
      id: `api_${apiProduct.Id}`,
      familia,
      modelo,
      acabamento,
      cor,
      comprimento,
      foto: undefined,
    };
  };

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
        let errorMessage = 'Erro ao carregar produtos da API';
        
        // Check if it's a CORS or network error
        if (err.message.includes('fetch') || err.name === 'TypeError') {
          errorMessage = 'Erro de CORS: A API não permite acesso direto do browser. Configure CORS no servidor ou use um proxy.';
        }
        
        setError(errorMessage);
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