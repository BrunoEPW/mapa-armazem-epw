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
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('Desconectado');
  const [activeFilters, setActiveFilters] = useState<ApiFilters>(initialFilters);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const totalPages = Math.ceil(allProducts.length / itemsPerPage);

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
        epwOriginalCode: codigo,
      };
    }
  };

  // Load all products in batches with fallback strategy
  const loadAllProducts = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    setLoading(true);
    setError(null);
    setConnectionStatus('Conectando à API...');

    try {
      // First, try to load a small batch to test connectivity
      console.log(`🔍 [useApiProductsWithFilters] Testing API connectivity...`);
      
      const testResponse = await apiService.fetchArtigosWithTotal(1, 0, 20, {});
      
      if (!testResponse.data || !Array.isArray(testResponse.data)) {
        throw new Error('API não está a responder correctamente');
      }

      const totalRecords = testResponse.recordsTotal || 0;
      console.log(`📊 [useApiProductsWithFilters] API working. Total records: ${totalRecords}`);
      
      // Load more data in a conservative way
      const allLoadedProducts: Product[] = [];
      let currentStart = 0;
      const batchSize = 50; // Smaller batches to avoid proxy limits
      const maxProducts = Math.min(totalRecords, 500); // Limit to first 500 products to avoid proxy issues
      let attemptedRequests = 0;
      const maxAttempts = 10; // Limit number of requests
      
      setConnectionStatus(`Carregando produtos... (máx. ${maxProducts})`);
      
      while (currentStart < maxProducts && attemptedRequests < maxAttempts) {
        if (controller.signal.aborted) {
          throw new Error('Request was aborted');
        }

        attemptedRequests++;
        console.log(`📦 [useApiProductsWithFilters] Loading batch ${attemptedRequests}: start=${currentStart}, length=${batchSize}`);
        
        try {
          const apiResponse = await apiService.fetchArtigosWithTotal(1, currentStart, batchSize, {});
          
          if (!apiResponse.data || !Array.isArray(apiResponse.data) || apiResponse.data.length === 0) {
            console.log(`✅ [useApiProductsWithFilters] No more data at start=${currentStart}`);
            break;
          }

          // Apply exclusions filter if provided
          const filteredBatch = exclusionFilter 
            ? apiResponse.data.filter(item => !exclusionFilter(item.strCodigo || ''))
            : apiResponse.data;

          const mappedBatch = filteredBatch.map(mapApiProductToProduct);
          allLoadedProducts.push(...mappedBatch);

          setConnectionStatus(`Carregados ${allLoadedProducts.length} produtos...`);
          
          currentStart += batchSize;
          
          // Small delay to avoid overwhelming proxies
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (batchError) {
          console.warn(`⚠️ [useApiProductsWithFilters] Batch ${attemptedRequests} failed:`, batchError);
          
          // If we already have some products, continue with what we have
          if (allLoadedProducts.length > 0) {
            console.log(`📦 [useApiProductsWithFilters] Continuing with ${allLoadedProducts.length} products loaded so far`);
            break;
          } else {
            throw batchError; // If no products loaded yet, throw the error
          }
        }
      }

      if (allLoadedProducts.length === 0) {
        throw new Error('Nenhum produto foi carregado da API');
      }

      console.log(`✅ [useApiProductsWithFilters] Successfully loaded ${allLoadedProducts.length} products`);
      
      setAllProducts(allLoadedProducts);
      updateLocalPagination(allLoadedProducts, 1);
      setConnectionStatus(`${allLoadedProducts.length} produtos carregados (limitado por restrições de proxy)`);
      
    } catch (err) {
      console.error('❌ [useApiProductsWithFilters] Error loading products:', err);
      
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
        setConnectionStatus('Erro de conexão - proxies indisponíveis');
      }
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
      abortControllerRef.current = null;
    }
  };

  // Update local pagination
  const updateLocalPagination = (productsArray = allProducts, page = currentPage) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = productsArray.slice(startIndex, endIndex);
    setProducts(paginatedProducts);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
    }
  };

  const setFilters = (filters: ApiFilters) => {
    setActiveFilters(filters);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setActiveFilters({});
    setCurrentPage(1);
  };

  const refresh = async () => {
    await loadAllProducts();
  };

  // Load all products on mount
  useEffect(() => {
    if (isInitialLoad) {
      loadAllProducts();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Update pagination when page changes
  useEffect(() => {
    if (!isInitialLoad && allProducts.length > 0) {
      updateLocalPagination();
    }
  }, [currentPage, allProducts, itemsPerPage]);

  return {
    products,
    loading,
    error,
    currentPage,
    totalPages,
    totalCount: allProducts.length,
    itemsPerPage,
    setCurrentPage: handlePageChange,
    refresh,
    isConnected: !error && allProducts.length > 0,
    connectionStatus,
    activeFilters,
    setFilters,
    clearFilters,
  };
};