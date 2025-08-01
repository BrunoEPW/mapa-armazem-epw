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

  // Load all products in batches
  const loadAllProducts = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    setLoading(true);
    setError(null);
    setConnectionStatus('Carregando todos os produtos...');

    try {
      const allLoadedProducts: Product[] = [];
      let currentStart = 0;
      const batchSize = 100; // Load in larger batches for efficiency
      let hasMoreData = true;
      let totalRecords = 0;
      
      while (hasMoreData && currentStart < 3000) { // Safety limit
        if (controller.signal.aborted) {
          throw new Error('Request was aborted');
        }

        console.log(`📦 [useApiProductsWithFilters] Loading batch: start=${currentStart}, length=${batchSize}`);
        
        const apiResponse = await apiService.fetchArtigosWithTotal(1, currentStart, batchSize, {});
        
        if (!apiResponse.data || !Array.isArray(apiResponse.data)) {
          console.warn(`⚠️ [useApiProductsWithFilters] Invalid response at start=${currentStart}`);
          break;
        }

        if (apiResponse.data.length === 0) {
          console.log(`✅ [useApiProductsWithFilters] No more data at start=${currentStart}`);
          hasMoreData = false;
          break;
        }

        // Store total records from first response
        if (currentStart === 0 && apiResponse.recordsTotal) {
          totalRecords = apiResponse.recordsTotal;
          setTotalCount(totalRecords);
        }

        // Apply exclusions filter if provided
        const filteredBatch = exclusionFilter 
          ? apiResponse.data.filter(item => !exclusionFilter(item.strCodigo || ''))
          : apiResponse.data;

        const mappedBatch = filteredBatch.map(mapApiProductToProduct);
        allLoadedProducts.push(...mappedBatch);

        setConnectionStatus(`Carregados ${allLoadedProducts.length}/${totalRecords || '?'} produtos...`);
        
        currentStart += batchSize;
        
        // Check if we've reached the end based on API response
        if (apiResponse.data.length < batchSize || currentStart >= totalRecords) {
          hasMoreData = false;
        }

        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`✅ [useApiProductsWithFilters] Loaded ${allLoadedProducts.length} total products`);
      
      setAllProducts(allLoadedProducts);
      updateLocalPagination(allLoadedProducts, 1); // Start at page 1
      setConnectionStatus(`${allLoadedProducts.length} produtos carregados com sucesso`);
      
    } catch (err) {
      console.error('❌ [useApiProductsWithFilters] Error loading all products:', err);
      
      if (err instanceof Error && err.name !== 'AbortError') {
        let errorMessage = 'Erro ao carregar produtos da API';
        
        if (err.message.includes('fetch') || err.name === 'TypeError') {
          errorMessage = 'CORS/Network: Não foi possível conectar à API';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Timeout: A API demorou muito para responder';
        }
        
        setError(errorMessage);
        setConnectionStatus('Erro de conexão');
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