import { useState, useEffect, useRef, useCallback } from 'react';
import { apiService } from '@/services/apiService';

interface SimpleProduct {
  id: string;
  codigo: string;
  descricao: string;
}

interface UseApiProductsSimpleReturn {
  products: SimpleProduct[];
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
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useApiProductsSimple = (modelo?: string): UseApiProductsSimpleReturn => {
  const itemsPerPage = 20;
  const [products, setProducts] = useState<SimpleProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('Desconectado');
  const [searchQuery, setSearchQuery] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cache removed - no caching enabled

  const mapApiProductToSimple = (apiProduct: any): SimpleProduct => {
    return {
      id: `api_${apiProduct.Id}`,
      codigo: apiProduct.strCodigo || 'Sem código',
      descricao: apiProduct.strDescricao || 'Sem descrição',
    };
  };

  const generateCacheKey = (page: number, search: string): string => {
    return `${page}-${search}`;
  };

  const loadProducts = useCallback(async (page: number = 1, search: string = '', forceRefresh: boolean = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    setLoading(true);
    setError(null);

    console.log('🚀 [useApiProductsSimple] Making fresh API call - no cache enabled');
    
    setConnectionStatus(search ? 'Pesquisando produtos...' : 'Carregando produtos...');

    try {
      const start = (page - 1) * itemsPerPage;
      console.log(`🔍 [useApiProductsSimple] Fetching page ${page} (start: ${start}) with search:`, search, 'modelo:', modelo);
      
      // Criar filtros para a API
      const filters: any = {};
      if (modelo && modelo !== 'all') {
        filters.Modelo = modelo;
      }
      
      // Para pesquisa simples, vamos buscar todos os produtos e filtrar localmente
      // devido às limitações da API para filtros por texto
      let response;
      if (search.trim()) {
        // Buscar mais produtos para pesquisa (mas com filtro de modelo se aplicável)
        response = await apiService.fetchArtigosWithTotal(1, 0, 1000, filters);
        
        // Filtrar localmente apenas por descrição
        const filtered = response.data.filter(item => 
          item.strDescricao?.toLowerCase().includes(search.toLowerCase())
        );
        
        // Paginar os resultados filtrados
        const paginatedData = filtered.slice(start, start + itemsPerPage);
        
        response = {
          ...response,
          data: paginatedData,
          recordsFiltered: filtered.length,
          recordsTotal: filtered.length
        };
      } else {
        // Busca normal com paginação da API e filtros
        response = await apiService.fetchArtigosWithTotal(1, start, itemsPerPage, filters);
      }
      
      console.log(`🔍 [useApiProductsSimple] API response:`, {
        dataLength: response.data?.length || 0,
        recordsTotal: response.recordsTotal,
        recordsFiltered: response.recordsFiltered,
        searchApplied: !!search.trim()
      });
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('API não está a responder correctamente');
      }

      const mappedProducts = response.data.map(mapApiProductToSimple);
      
      // Use filtered count when filters are applied (search OR model filter)
      const hasFilters = search.trim() || (modelo && modelo !== 'all');
      const totalRecords = hasFilters ? response.recordsFiltered : response.recordsTotal;
      
      setProducts(mappedProducts);
      setTotalCount(totalRecords || 0);
      setTotalPages(Math.ceil((totalRecords || 0) / itemsPerPage));

      // No caching - just continue

      const statusMessage = hasFilters
        ? `${mappedProducts.length} produtos encontrados (${totalRecords} total filtrados)`
        : `${mappedProducts.length} produtos carregados`;
      
      setConnectionStatus(statusMessage);
      
    } catch (err) {
      console.error('❌ [useApiProductsSimple] Error loading products:', err);
      
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
  }, [itemsPerPage, modelo]);

  const debouncedLoadProducts = useCallback((page: number, search: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      loadProducts(page, search, false);
    }, 500); // 500ms debounce for search
  }, [loadProducts]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
      loadProducts(page, searchQuery, false);
    }
  };

  const handleSearchQuery = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    debouncedLoadProducts(1, query);
  };

  const refresh = async () => {
    console.log('🔄 [useApiProductsSimple] Manual refresh initiated - no cache to clear');
    await loadProducts(currentPage, searchQuery, true);
  };

  // Load initial products on mount
  useEffect(() => {
    loadProducts(1, '', false);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [loadProducts]);

  // Reset to page 1 when model filter changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
      loadProducts(1, searchQuery, false);
    } else {
      loadProducts(1, searchQuery, false);
    }
  }, [modelo]);

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
    searchQuery,
    setSearchQuery: handleSearchQuery,
  };
};