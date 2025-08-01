import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Product } from '@/types/warehouse';
import { apiService, ApiFilters } from '@/services/apiService';
import { config } from '@/lib/config';
import { decodeEPWReference, getEPWFamilia, getEPWModelo, getEPWAcabamento, getEPWCor, getEPWComprimento } from '@/utils/epwCodeDecoder';

interface UseOptimizedProductLoaderReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  isConnected: boolean;
  connectionStatus: string;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  refresh: () => Promise<void>;
}

export const useOptimizedProductLoader = (
  exclusionFilter?: (codigo: string) => boolean,
  initialBatchSize: number = 50
): UseOptimizedProductLoaderReturn => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentStart, setCurrentStart] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('Aguardando carregamento...');
  const [isInitialized, setIsInitialized] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const batchSize = initialBatchSize;

  const mapApiProductToProduct = useCallback((apiProduct: any): Product => {
    const description = apiProduct.strDescricao || 'Sem descrição';
    const codigo = apiProduct.strCodigo || 'Sem código';
    
    const epwDecodeResult = decodeEPWReference(codigo, config.isDevelopment);
    
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
  }, []);

  const loadBatch = useCallback(async (start: number, append: boolean = true) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    if (!append) {
      setError(null);
      setConnectionStatus('Conectando à API...');
    }

    try {
      console.log(`🔍 [useOptimizedProductLoader] Loading batch at start=${start}, size=${batchSize}`);
      
      const apiResponse = await apiService.fetchArtigosWithTotal(1, start, batchSize, {});
      
      if (!apiResponse.data || !Array.isArray(apiResponse.data)) {
        throw new Error('API não está a responder correctamente');
      }

      // Set total count from first response
      if (!append || totalCount === 0) {
        setTotalCount(apiResponse.recordsTotal || 0);
      }

      if (apiResponse.data.length === 0) {
        setHasMore(false);
        setConnectionStatus(append ? 
          `${products.length} produtos carregados (fim da lista)` : 
          'Nenhum produto disponível'
        );
        return;
      }

      // Apply exclusions filter if provided
      const filteredBatch = exclusionFilter 
        ? apiResponse.data.filter(item => !exclusionFilter(item.strCodigo || ''))
        : apiResponse.data;

      const mappedBatch = filteredBatch.map(mapApiProductToProduct);

      if (append) {
        setProducts(prev => [...prev, ...mappedBatch]);
        setConnectionStatus(`${products.length + mappedBatch.length} produtos carregados`);
      } else {
        setProducts(mappedBatch);
        setConnectionStatus(`${mappedBatch.length} produtos carregados`);
      }

      setCurrentStart(start + batchSize);
      setHasMore(apiResponse.data.length >= batchSize);

      console.log(`✅ [useOptimizedProductLoader] Loaded ${mappedBatch.length} products (total: ${append ? products.length + mappedBatch.length : mappedBatch.length})`);
      
    } catch (err) {
      console.error('❌ [useOptimizedProductLoader] Error loading batch:', err);
      
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
  }, [batchSize, exclusionFilter, mapApiProductToProduct, products.length, totalCount]);

  const loadMore = useCallback(async () => {
    if (!loading && hasMore) {
      await loadBatch(currentStart, true);
    }
  }, [currentStart, hasMore, loadBatch, loading]);

  const refresh = useCallback(async () => {
    setProducts([]);
    setCurrentStart(0);
    setHasMore(true);
    setTotalCount(0);
    await loadBatch(0, false);
  }, [loadBatch]);

  // Initial load
  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true);
      loadBatch(0, false);
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isInitialized, loadBatch]);

  const isConnected = useMemo(() => !error && products.length > 0, [error, products.length]);

  return {
    products,
    loading,
    error,
    totalCount,
    isConnected,
    connectionStatus,
    loadMore,
    hasMore,
    refresh,
  };
};