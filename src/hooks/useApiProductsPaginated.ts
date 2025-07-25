import { useState, useEffect, useRef } from 'react';
import { Product } from '@/types/warehouse';
import { apiService } from '@/services/apiService';
import { config } from '@/lib/config';
import { decodeEPWReference, getEPWFamilia, getEPWModelo, getEPWAcabamento, getEPWCor, getEPWComprimento } from '@/utils/epwCodeDecoder';

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
  isConnected: boolean;
  connectionStatus: string;
}

export const useApiProductsPaginated = (
  itemsPerPage: number = 20,
  exclusionFilter?: (codigo: string) => boolean
): UseApiProductsPaginatedReturn => {
  console.log('🔍 [useApiProductsPaginated] Hook inicializado com', itemsPerPage, 'itens por página, exclusionFilter:', !!exclusionFilter);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('Desconectado');
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

  const fetchPageData = async (page: number) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      console.log(`🔍 [useApiProductsPaginated] Fetching page ${page}...`);
      setConnectionStatus('Conectando...');
      
      const start = (page - 1) * itemsPerPage;
      const apiResponse = await apiService.fetchArtigosWithTotal(1, start, itemsPerPage);
      
      console.log('📊 [useApiProductsPaginated] API response:', {
        dataLength: apiResponse.data?.length || 0,
        recordsTotal: apiResponse.recordsTotal,
        recordsFiltered: apiResponse.recordsFiltered,
        totalCountUsed: apiResponse.recordsFiltered || apiResponse.recordsTotal || 0,
        start,
        length: itemsPerPage
      });
      
      if (!apiResponse.data || !Array.isArray(apiResponse.data)) {
        throw new Error('API retornou dados inválidos ou nulos');
      }
      
      // Apply exclusions filter if provided
      console.log(`🔍 [useApiProductsPaginated] Processing ${apiResponse.data.length} products, exclusionFilter available: ${!!exclusionFilter}`);
      
      const filteredData = exclusionFilter 
        ? apiResponse.data.filter(item => {
            const codigo = item.strCodigo || '';
            const shouldExclude = exclusionFilter(codigo);
            if (config.isDevelopment && shouldExclude) {
              console.log(`🚫 [Exclusions] Excluding product: ${codigo}`);
            }
            if (config.isDevelopment && !shouldExclude && codigo.toUpperCase().includes('DIV')) {
              console.log(`✅ [Exclusions] Keeping product with DIV: ${codigo} (exclusion check returned: ${shouldExclude})`);
            }
            return !shouldExclude;
          })
        : apiResponse.data;
      
      if (config.isDevelopment && exclusionFilter) {
        console.log(`📊 [Exclusions] Original: ${apiResponse.data.length}, Filtered: ${filteredData.length}`);
        if (apiResponse.data.length > 0) {
          console.log('📝 [Exclusions] Sample codes:', apiResponse.data.slice(0, 3).map(item => item.strCodigo));
        }
      }
      const mappedProducts = filteredData.map(mapApiProductToProduct);
      
      setProducts(mappedProducts);
      
      // Detect actual end of data and adjust pagination
      if (apiResponse.data.length === 0 && page > 1) {
        // If we get no data on a page beyond 1, we've reached the end
        const actualTotalCount = (page - 1) * itemsPerPage;
        setTotalCount(actualTotalCount);
        setCurrentPage(1); // Auto-redirect to page 1 where data exists
        console.log(`📊 [useApiProductsPaginated] Detected end of data at page ${page}, redirecting to page 1`);
        return; // Exit early to avoid processing empty data
      } else {
        // Use filtered count if available, otherwise use records total but cap it based on actual data availability
        const baseCount = apiResponse.recordsFiltered || apiResponse.recordsTotal || 0;
        setTotalCount(baseCount);
      }
      
      setConnectionStatus('Conectado via proxy CORS');
      
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
    isConnected: !error && totalCount > 0,
    connectionStatus,
  };
};