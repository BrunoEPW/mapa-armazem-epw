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
      
      // Enhanced loading strategy with multiple retry attempts
      const allLoadedProducts: Product[] = [];
      let currentStart = 0;
      const batchSize = 50;
      const maxProducts = Math.min(totalRecords, 1000); // Try to load up to 1000 products
      let consecutiveFailures = 0;
      const maxConsecutiveFailures = 3; // Stop after 3 consecutive failures
      let totalAttempts = 0;
      const maxTotalAttempts = 20; // Maximum total attempts
      
      setConnectionStatus(`Carregando produtos... (máx. ${maxProducts})`);
      
      while (currentStart < maxProducts && totalAttempts < maxTotalAttempts && consecutiveFailures < maxConsecutiveFailures) {
        if (controller.signal.aborted) {
          throw new Error('Request was aborted');
        }

        totalAttempts++;
        console.log(`📦 [useApiProductsWithFilters] Attempt ${totalAttempts}: start=${currentStart}, length=${batchSize}`);
        
        try {
          const apiResponse = await apiService.fetchArtigosWithTotal(1, currentStart, batchSize, {});
          
          if (!apiResponse.data || !Array.isArray(apiResponse.data)) {
            throw new Error(`Invalid response at start=${currentStart}`);
          }

          if (apiResponse.data.length === 0) {
            console.log(`✅ [useApiProductsWithFilters] No more data at start=${currentStart}`);
            break;
          }

          // Apply exclusions filter if provided
          const filteredBatch = exclusionFilter 
            ? apiResponse.data.filter(item => !exclusionFilter(item.strCodigo || ''))
            : apiResponse.data;

          const mappedBatch = filteredBatch.map(mapApiProductToProduct);
          allLoadedProducts.push(...mappedBatch);

          // Reset consecutive failures on success
          consecutiveFailures = 0;
          
          setConnectionStatus(`Carregados ${allLoadedProducts.length} produtos...`);
          
          currentStart += batchSize;
          
          // Adaptive delay based on success rate
          const delay = consecutiveFailures > 0 ? 500 : 300; // Longer delay if we've had failures
          await new Promise(resolve => setTimeout(resolve, delay));
          
        } catch (batchError) {
          consecutiveFailures++;
          console.warn(`⚠️ [useApiProductsWithFilters] Batch attempt ${totalAttempts} failed (consecutive failures: ${consecutiveFailures}):`, batchError);
          
          if (consecutiveFailures < maxConsecutiveFailures) {
            // Try the next batch position instead of retrying the same position
            currentStart += batchSize;
            console.log(`🔄 [useApiProductsWithFilters] Skipping to next batch at start=${currentStart}`);
            
            // Wait longer before next attempt
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            console.log(`❌ [useApiProductsWithFilters] Too many consecutive failures, stopping at ${allLoadedProducts.length} products`);
            break;
          }
        }
      }

      if (allLoadedProducts.length === 0) {
        throw new Error('Nenhum produto foi carregado da API');
      }

      console.log(`✅ [useApiProductsWithFilters] Successfully loaded ${allLoadedProducts.length} products (attempted ${totalAttempts} requests)`);
      
      setAllProducts(allLoadedProducts);
      
      const statusMessage = consecutiveFailures >= maxConsecutiveFailures 
        ? `${allLoadedProducts.length} produtos carregados (proxies instáveis - algumas páginas ignoradas)`
        : `${allLoadedProducts.length} produtos carregados (limitado por restrições de proxy)`;
      
      setConnectionStatus(statusMessage);
      
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

  // Remove the updateLocalPagination function since we're sending all products to the component

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

  // Update pagination when page changes - not needed since Products component handles pagination
  // useEffect(() => {
  //   if (!isInitialLoad && allProducts.length > 0) {
  //     updateLocalPagination();
  //   }
  // }, [currentPage, allProducts, itemsPerPage]);

  return {
    products: allProducts, // Send ALL products to the component
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