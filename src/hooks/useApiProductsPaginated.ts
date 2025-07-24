import { useState, useEffect, useRef } from 'react';
import { Product } from '@/types/warehouse';
import { apiService } from '@/services/apiService';
import { config } from '@/lib/config';

interface UseApiProductsPaginatedReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  itemsPerPage: number;
  setCurrentPage: (page: number) => void;
  refresh: () => Promise<void>;
}

export const useApiProductsPaginated = (itemsPerPage: number = 20): UseApiProductsPaginatedReturn => {
  console.log('🔍 [useApiProductsPaginated] Hook inicializado com', itemsPerPage, 'itens por página');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const mapApiProductToProduct = (apiProduct: any): Product => {
    const description = apiProduct.strDescricao || 'Sem descrição';
    const codigo = apiProduct.strCodigo || 'Sem código';
    
    if (config.isDevelopment) {
      console.log('Mapping API product:', { Id: apiProduct.Id, strCodigo: codigo, strDescricao: description });
    }
    
    return {
      id: `api_${apiProduct.Id}`,
      familia: 'API',
      modelo: codigo,
      acabamento: description,
      cor: 'N/A',
      comprimento: 0,
      foto: apiProduct.strFoto || undefined,
    };
  };

  const fetchPageData = async (page: number) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      console.log(`🔍 [useApiProductsPaginated] Fetching page ${page}...`);
      
      const start = (page - 1) * itemsPerPage;
      const apiResponse = await apiService.fetchArtigosWithTotal(1, start, itemsPerPage);
      
      console.log('📊 [useApiProductsPaginated] API response:', {
        dataLength: apiResponse.data?.length || 0,
        totalCount: apiResponse.recordsTotal,
        start,
        length: itemsPerPage
      });
      
      if (!apiResponse.data || !Array.isArray(apiResponse.data)) {
        throw new Error('API retornou dados inválidos ou nulos');
      }
      
      const mappedProducts = apiResponse.data.map(mapApiProductToProduct);
      
      setProducts(mappedProducts);
      setTotalCount(apiResponse.recordsTotal || 0);
      
      if (config.isDevelopment) {
        console.log(`✅ [useApiProductsPaginated] Successfully loaded ${mappedProducts.length} products from API for page ${page}`);
      }
    } catch (err) {
      console.error('❌ [useApiProductsPaginated] Error details:', {
        error: err,
        page,
        start: (page - 1) * itemsPerPage
      });
      
      if (err instanceof Error && err.name !== 'AbortError') {
        let errorMessage = 'Erro ao conectar com a API de produtos';
        
        if (err.message.includes('fetch') || err.name === 'TypeError') {
          errorMessage = 'CORS/Network: Não foi possível conectar à API. Verifique se a API está online.';
        } else if (err.message.includes('timeout') || err.message.includes('AbortError')) {
          errorMessage = 'Timeout: A API demorou muito para responder.';
        } else if (err.message.includes('404')) {
          errorMessage = 'API não encontrada: Endpoint não existe.';
        } else if (err.message.includes('500')) {
          errorMessage = 'Erro interno da API: Servidor com problemas.';
        } else if (err.message.includes('inválidos')) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage && !loading) {
      setCurrentPage(page);
    }
  };

  const refresh = async () => {
    await fetchPageData(currentPage);
  };

  useEffect(() => {
    fetchPageData(currentPage);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [currentPage, itemsPerPage]);

  return {
    products,
    loading,
    error,
    currentPage,
    totalPages,
    totalCount,
    itemsPerPage,
    setCurrentPage: handlePageChange,
    refresh,
  };
};