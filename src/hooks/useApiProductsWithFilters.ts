import { useState, useEffect, useRef } from 'react';
import { Product } from '@/types/warehouse';
import { apiService, ApiFilters } from '@/services/apiService';
import { config } from '@/lib/config';
import { decodeEPWReference, getEPWFamilia, getEPWModelo, getEPWAcabamento, getEPWCor, getEPWComprimento } from '@/utils/epwCodeDecoder';

interface UseApiProductsWithFiltersReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  itemsPerPage: number;
  setCurrentPage: (page: number) => void;
  refresh: () => Promise<void>;
  isConnected: boolean;
  connectionStatus: string;
  activeFilters: ApiFilters;
  setFilters: (filters: ApiFilters) => void;
  clearFilters: () => void;
}

export const useApiProductsWithFilters = (
  itemsPerPage: number = 20,
  exclusionFilter?: (codigo: string) => boolean,
  initialFilters: ApiFilters = {}
): UseApiProductsWithFiltersReturn => {
  
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('Desconectado');
  const [activeFilters, setActiveFilters] = useState<ApiFilters>(initialFilters);
  const abortControllerRef = useRef<AbortController | null>(null);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const mapApiProductToProduct = (apiProduct: any): Product => {
    const description = apiProduct.strDescricao || 'Sem descrição';
    const codigo = apiProduct.strCodigo || 'Sem código';
    
    // Try to decode EPW reference if available
    const epwDecodeResult = decodeEPWReference(codigo, config.isDevelopment);
    
    
    // Use EPW decoded data if successful, otherwise fallback to API data
    if (epwDecodeResult.success && epwDecodeResult.product) {
      const decoded = epwDecodeResult.product;
      
      return {
        id: `api_${apiProduct.Id}`,
        familia: getEPWFamilia(decoded),
        modelo: getEPWModelo(decoded),
        acabamento: getEPWAcabamento(decoded),
        cor: getEPWCor(decoded),
        comprimento: getEPWComprimento(decoded),
        foto: apiProduct.strFoto || undefined,
        // Always preserve API description when available
        codigo: codigo,
        descricao: description, // Use API description
        // Store EPW decoded details
        epwTipo: decoded.tipo,
        epwCertificacao: decoded.certif,
        epwModelo: decoded.modelo,
        epwComprimento: decoded.comprim,
        epwCor: decoded.cor,
        epwAcabamento: decoded.acabamento,
        epwOriginalCode: codigo,
      };
    } else {
      
      return {
        id: `api_${apiProduct.Id}`,
        familia: 'Produto API',
        modelo: codigo,
        acabamento: description,
        cor: 'N/A',
        comprimento: 0,
        foto: apiProduct.strFoto || undefined,
        // Ensure API fields are properly mapped for display
        codigo: codigo,
        descricao: description,
        epwOriginalCode: codigo,
      };
    }
  };

  const fetchPageData = async (page: number, filters: ApiFilters = {}) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    

    try {
      
      setConnectionStatus('Conectando...');
      
      const start = (page - 1) * itemsPerPage;
      
      // Only apply non-empty filters to the API call
      const apiFilters: ApiFilters = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== '') {
          apiFilters[key as keyof ApiFilters] = value;
        }
      });
      
      const apiResponse = await apiService.fetchArtigosWithTotal(1, start, itemsPerPage, apiFilters);

      
      if (!apiResponse.data || !Array.isArray(apiResponse.data)) {
        throw new Error('API retornou dados inválidos ou nulos');
      }
      
      // Apply exclusions filter if provided (client-side)
      const filteredData = exclusionFilter 
        ? apiResponse.data.filter(item => {
            const shouldExclude = exclusionFilter(item.strCodigo || '');
            return !shouldExclude;
          })
        : apiResponse.data;
      
      const originalCount = apiResponse.recordsFiltered || apiResponse.recordsTotal || 0;
      const excludedCount = apiResponse.data.length - filteredData.length;
      
      // Estimate total count after exclusions (approximation for pagination)
      const estimatedTotalAfterExclusions = exclusionFilter && excludedCount > 0
        ? Math.max(1, Math.round(originalCount * (filteredData.length / apiResponse.data.length)))
        : originalCount;
      
      
      const mappedProducts = filteredData.map(mapApiProductToProduct);
      
      setProducts(mappedProducts);
      setTotalCount(estimatedTotalAfterExclusions);
      const exclusionInfo = exclusionFilter && excludedCount > 0 ? ` (${excludedCount} excluídos)` : '';
      setConnectionStatus(`Conectado via proxy CORS${Object.keys(apiFilters).length > 0 ? ' (com filtros)' : ''}${exclusionInfo}`);
      
    } catch (err) {
      console.error('❌ [useApiProductsWithFilters] Error details:', {
        error: err,
        page,
        start: (page - 1) * itemsPerPage,
        filters
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
        setConnectionStatus('Erro de conexão - múltiplos proxies falharam');
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

  const setFilters = (filters: ApiFilters) => {
    
    setActiveFilters(filters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    
    setActiveFilters({});
    setCurrentPage(1);
  };

  const refresh = async () => {
    await fetchPageData(currentPage, activeFilters);
  };

  // Fetch data when page or filters change
  useEffect(() => {
    fetchPageData(currentPage, activeFilters);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [currentPage, activeFilters, itemsPerPage]);

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
    isConnected: !error && totalCount > 0,
    connectionStatus,
    activeFilters,
    setFilters,
    clearFilters,
  };
};