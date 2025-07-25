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
  console.log('🔍 [useApiProductsWithFilters] Hook inicializado com filtros:', initialFilters);
  
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
    
    if (config.isDevelopment) {
      console.log('Mapping API product:', { 
        Id: apiProduct.Id, 
        strCodigo: codigo, 
        strDescricao: description,
        epwDecoded: epwDecodeResult.success,
        epwData: epwDecodeResult.decoded
      });
    }
    
    // Use EPW decoded data if successful, otherwise fallback to API data
    if (epwDecodeResult.success && epwDecodeResult.decoded) {
      const decoded = epwDecodeResult.decoded;
      
      return {
        id: `api_${apiProduct.Id}`,
        familia: getEPWFamilia(decoded),
        modelo: getEPWModelo(decoded),
        acabamento: getEPWAcabamento(decoded),
        cor: getEPWCor(decoded),
        comprimento: getEPWComprimento(decoded),
        foto: apiProduct.strFoto || undefined,
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
      // Fallback to original mapping for non-EPW products
      return {
        id: `api_${apiProduct.Id}`,
        familia: 'API',
        modelo: codigo, // Keep for backward compatibility
        acabamento: description, // Keep for backward compatibility
        cor: 'N/A',
        comprimento: 0,
        foto: apiProduct.strFoto || undefined,
        // Correct mapping for API fields
        codigo: codigo, // strCodigo da API
        descricao: description, // strDescricao da API
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

    console.log('🔍 [useApiProductsWithFilters] Fetching with filters:', filters);

    try {
      console.log(`🔍 [useApiProductsWithFilters] Fetching page ${page} with filters:`, filters);
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

      console.log('📊 [useApiProductsWithFilters] API Response:', {
        recordsTotal: apiResponse.recordsTotal,
        recordsFiltered: apiResponse.recordsFiltered,
        dataLength: apiResponse.data?.length || 0,
        filters: apiFilters
      });
      
      console.log('📊 [useApiProductsWithFilters] API response:', {
        dataLength: apiResponse.data?.length || 0,
        recordsTotal: apiResponse.recordsTotal,
        recordsFiltered: apiResponse.recordsFiltered,
        totalCountUsed: apiResponse.recordsFiltered || apiResponse.recordsTotal || 0,
        start,
        length: itemsPerPage,
        filtersApplied: Object.keys(apiFilters)
      });
      
      if (!apiResponse.data || !Array.isArray(apiResponse.data)) {
        throw new Error('API retornou dados inválidos ou nulos');
      }
      
      // Apply exclusions filter if provided (client-side)
      const filteredData = exclusionFilter 
        ? apiResponse.data.filter(item => {
            const shouldExclude = exclusionFilter(item.strCodigo || '');
            if (config.isDevelopment && shouldExclude) {
              console.log(`🚫 [Exclusions] Excluding product: ${item.strCodigo}`);
            }
            return !shouldExclude;
          })
        : apiResponse.data;
      
      if (config.isDevelopment && exclusionFilter) {
        console.log(`📊 [Exclusions] Original: ${apiResponse.data.length}, Filtered: ${filteredData.length}`);
      }
      
      const mappedProducts = filteredData.map(mapApiProductToProduct);
      
      setProducts(mappedProducts);
      setTotalCount(apiResponse.recordsFiltered || apiResponse.recordsTotal || 0);
      setConnectionStatus(`Conectado via proxy CORS${Object.keys(apiFilters).length > 0 ? ' (com filtros)' : ''}`);
      
      if (config.isDevelopment) {
        console.log(`✅ [useApiProductsWithFilters] Successfully loaded ${mappedProducts.length} products from API for page ${page} with filters:`, apiFilters);
      }
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
    console.log('🔍 [useApiProductsWithFilters] Setting new filters:', filters);
    setActiveFilters(filters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    console.log('🔍 [useApiProductsWithFilters] Clearing all filters');
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