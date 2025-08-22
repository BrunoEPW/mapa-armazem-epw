import { useState, useEffect, useRef, useCallback } from 'react';
import { Product } from '@/types/warehouse';
import { apiService, ApiFilters } from '@/services/apiService';
import { config } from '@/lib/config';
import { decodeEPWReference, getEPWFamilia, getEPWModelo, getEPWAcabamento, getEPWCor, getEPWComprimento } from '@/utils/epwCodeDecoder';

interface UseApiProductsWithFiltersServerSideOptions {
  enabled?: boolean;
}

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
  options: UseApiProductsWithFiltersServerSideOptions = {}
): UseApiProductsWithFiltersServerSideReturn => {
  const { enabled = true } = options;
  const itemsPerPage = 20;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('Desconectado');
  const [activeFilters, setActiveFilters] = useState<ApiFilters>({});
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cache removed - no caching enabled

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
    
    console.log('🚀 [useApiProductsWithFiltersServerSide] Making fresh API call - no cache enabled');
    
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
      
      // 🚨 CRITICAL FIX: Reset to page 1 when API returns empty data but claims products exist
      if (response.data.length === 0 && (response.recordsFiltered > 0 || response.recordsTotal > 0) && page > 1) {
        console.warn('🔄 [useApiProductsWithFiltersServerSide] API pagination issue detected - resetting to page 1');
        setCurrentPage(1);
        setTimeout(() => loadProducts(1, filters), 100); // Retry with page 1
        return;
      }
      
      // 🚨 EMERGENCY FALLBACK: If API returns empty on page 1 but claims products exist, show warning but continue
      if (response.data.length === 0 && (response.recordsFiltered > 0 || response.recordsTotal > 0) && page === 1) {
        console.error('🚨 [useApiProductsWithFiltersServerSide] CRITICAL: API pagination broken - showing empty despite claiming products exist');
        setConnectionStatus('⚠️ API paginating incorrectly - contact support');
      }
      
      // 🚨 CRITICAL DEBUG: Log the empty data issue
      if (response.data.length === 0 && (response.recordsFiltered > 0 || response.recordsTotal > 0)) {
        console.error('🚨 [useApiProductsWithFiltersServerSide] CRITICAL ISSUE: API claims products exist but returns empty data array!', {
          expectedFromAPI: response.recordsFiltered || response.recordsTotal,
          actualReceived: response.data.length,
          startOffset: start,
          lengthRequested: itemsPerPage,
          filtersApplied: apiFilters,
          suggestedFix: 'Reset to page 1 or clear filters'
        });
      }

      // Process received products
      let processedProducts = response.data;

      const mappedProducts = processedProducts.map(mapApiProductToProduct);
      
      // Use appropriate total count: recordsFiltered when filters applied, recordsTotal when no filters
      const totalRecords = hasFilters ? (response.recordsFiltered || 0) : (response.recordsTotal || 0);
      
      setProducts(mappedProducts);
      setTotalCount(totalRecords);
      setTotalPages(Math.ceil(totalRecords / itemsPerPage));

      // No caching - just continue

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
  }, [itemsPerPage]);

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
    console.log('🔄 [useApiProductsWithFiltersServerSide] Manual refresh initiated - no cache to clear');
    await loadProducts(currentPage, activeFilters);
  };

  // Load initial products on mount
  useEffect(() => {
    if (enabled) {
      loadProducts(1, {});
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [enabled, loadProducts]);

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