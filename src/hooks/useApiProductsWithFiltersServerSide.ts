import { useState, useEffect, useRef, useCallback } from 'react';
import { Product } from '@/types/warehouse';
import { apiService, ApiFilters } from '@/services/apiService';
import { config } from '@/lib/config';
import { decodeEPWReference, getEPWFamilia, getEPWModelo, getEPWAcabamento, getEPWCor, getEPWComprimento } from '@/utils/epwCodeDecoder';

interface UseApiProductsWithFiltersServerSideReturn {
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

export const useApiProductsWithFiltersServerSide = (
  itemsPerPage: number = 20,
  exclusionFilter?: (codigo: string) => boolean,
  initialFilters: ApiFilters = {}
): UseApiProductsWithFiltersServerSideReturn => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('Desconectado');
  const [activeFilters, setActiveFilters] = useState<ApiFilters>(initialFilters);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cache para evitar requisições desnecessárias
  const cacheRef = useRef<Map<string, { products: Product[]; totalCount: number; timestamp: number }>>(new Map());
  const cacheTimeout = 5 * 60 * 1000; // 5 minutos

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
        codigo: codigo,
        descricao: description,
        epwTipo: decoded.tipo,
        epwCertificacao: decoded.certif,
        epwModelo: decoded.modelo,
        epwComprimento: decoded.comprim,
        epwCor: decoded.cor,
        epwAcabamento: decoded.acabamento,
        epwOriginalCode: codigo,
      };
    } else {
      // Non-EPW product - do NOT set epwOriginalCode
      return {
        id: `api_${apiProduct.Id}`,
        familia: 'Produto API',
        modelo: codigo,
        acabamento: description,
        cor: 'N/A',
        comprimento: 0,
        foto: apiProduct.strFoto || undefined,
        codigo: codigo,
        descricao: description,
        // epwOriginalCode is intentionally NOT set for non-EPW products
      };
    }
  };

  const generateCacheKey = (page: number, filters: ApiFilters): string => {
    return `${page}-${JSON.stringify(filters)}`;
  };

  const loadProducts = useCallback(async (page: number = 1, filters: ApiFilters = {}) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    setLoading(true);
    setError(null);

    // Check if there are active filters
    const hasFilters = Object.values(filters).some(value => value && value !== 'all' && value.trim() !== '');
    
    // Verificar cache
    const cacheKey = generateCacheKey(page, filters);
    const cached = cacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheTimeout) {
      console.log('📦 [useApiProductsWithFiltersServerSide] Using cache for:', cacheKey);
      setProducts(cached.products);
      setTotalCount(cached.totalCount);
      setTotalPages(Math.ceil(cached.totalCount / itemsPerPage));
      setLoading(false);
      return;
    }
    
    setConnectionStatus(
      hasFilters 
        ? 'Aplicando filtros no servidor...' 
        : 'Carregando produtos...'
    );

    try {
      const start = (page - 1) * itemsPerPage;
      console.log(`🔍 [useApiProductsWithFiltersServerSide] Fetching page ${page} (start: ${start}) with filters:`, filters);
      
      // Send filters to API only when they exist
      const apiFilters = hasFilters ? filters : {};
      const response = await apiService.fetchArtigosWithTotal(1, start, itemsPerPage, apiFilters);
      
      console.log(`🔍 [useApiProductsWithFiltersServerSide] Raw API response:`, {
        draw: response.draw,
        recordsTotal: response.recordsTotal,
        recordsFiltered: response.recordsFiltered,
        dataLength: response.data?.length || 0,
        hasFilters,
        apiFilters,
        isEmpty: response.data?.length === 0,
        shouldHaveData: response.recordsFiltered > 0 || response.recordsTotal > 0
      });
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('API não está a responder correctamente');
      }
      
      // 🚨 CRITICAL DEBUG: Log the empty data issue
      if (response.data.length === 0 && (response.recordsFiltered > 0 || response.recordsTotal > 0)) {
        console.error('🚨 [useApiProductsWithFiltersServerSide] CRITICAL ISSUE: API claims products exist but returns empty data array!', {
          expectedFromAPI: response.recordsFiltered || response.recordsTotal,
          actualReceived: response.data.length,
          startOffset: start,
          lengthRequested: itemsPerPage,
          filtersApplied: apiFilters,
          possibleCauses: [
            'API pagination issue - start offset might be beyond available data',
            'API filter bug - filters might be returning wrong recordsFiltered count',
            'API internal error - server-side processing issue'
          ]
        });
      }

      // Apply exclusions filter if provided
      let excludedCount = 0;
      const filteredData = exclusionFilter 
        ? response.data.filter(item => {
            const shouldExclude = exclusionFilter(item.strCodigo || '');
            if (shouldExclude) excludedCount++;
            return !shouldExclude;
          })
        : response.data;

      console.log(`🚫 [useApiProductsWithFiltersServerSide] Exclusion filtering:`, {
        apiDataLength: response.data.length,
        excludedCount,
        finalDataLength: filteredData.length,
        exclusionFilterActive: !!exclusionFilter
      });

      const mappedProducts = filteredData.map(mapApiProductToProduct);
      
      // Use appropriate total count: recordsFiltered when filters applied, recordsTotal when no filters
      const totalRecords = hasFilters ? (response.recordsFiltered || 0) : (response.recordsTotal || 0);
      
      setProducts(mappedProducts);
      setTotalCount(totalRecords);
      setTotalPages(Math.ceil(totalRecords / itemsPerPage));

      // Cache do resultado
      cacheRef.current.set(cacheKey, {
        products: mappedProducts,
        totalCount: totalRecords,
        timestamp: Date.now()
      });

      const statusMessage = hasFilters 
        ? `${mappedProducts.length} produtos encontrados (filtrados no servidor)`
        : `${mappedProducts.length} produtos carregados`;
      
      setConnectionStatus(statusMessage);
      
    } catch (err) {
      console.error('❌ [useApiProductsWithFiltersServerSide] Error loading products:', err);
      
      if (err instanceof Error && err.name !== 'AbortError') {
        let errorMessage = 'Erro ao carregar produtos da API';
        
        if (err.message.includes('proxy') || err.message.includes('403') || err.message.includes('Forbidden')) {
          errorMessage = 'Proxies CORS indisponíveis. Tente novamente mais tarde.';
        } else if (err.message.includes('fetch') || err.name === 'TypeError') {
          errorMessage = 'Não foi possível conectar à API';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Timeout: A API demorou muito para responder';
        }
        
        setError(errorMessage);
        setConnectionStatus('Erro de conexão');
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [itemsPerPage, exclusionFilter]);

  const debouncedLoadProducts = useCallback((page: number, filters: ApiFilters) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      loadProducts(page, filters);
    }, 300); // 300ms debounce
  }, [loadProducts]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
      loadProducts(page, activeFilters);
    }
  };

  const setFilters = (filters: ApiFilters) => {
    console.log('🔧 [useApiProductsWithFiltersServerSide] Setting filters:', filters);
    setActiveFilters(filters);
    setCurrentPage(1);
    debouncedLoadProducts(1, filters);
  };

  const clearFilters = () => {
    console.log('🔧 [useApiProductsWithFiltersServerSide] Clearing filters');
    setActiveFilters({});
    setCurrentPage(1);
    loadProducts(1, {});
  };

  const refresh = async () => {
    cacheRef.current.clear();
    await loadProducts(currentPage, activeFilters);
  };

  // Load initial products on mount
  useEffect(() => {
    loadProducts(1, initialFilters);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

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
    isConnected: !error && products.length >= 0,
    connectionStatus,
    activeFilters,
    setFilters,
    clearFilters,
  };
};