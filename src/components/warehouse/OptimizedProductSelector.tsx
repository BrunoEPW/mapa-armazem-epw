import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Product } from '@/types/warehouse';
import { useOptimizedProductLoader } from '@/hooks/useOptimizedProductLoader';
import { useOptimizedAttributes } from '@/hooks/useOptimizedAttributes';
import { useExclusions } from '@/contexts/ExclusionsContext';
import { EPWFilters } from './EPWFilters';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ChevronDown, Loader2 } from 'lucide-react';

interface OptimizedProductSelectorProps {
  selectedProductId: string | null;
  onProductSelect: (productId: string, product: Product) => void;
}

interface EPWFiltersState {
  modelo: string;
  comprimento: string;
  cor: string;
  acabamento: string;
}

export const OptimizedProductSelector: React.FC<OptimizedProductSelectorProps> = ({
  selectedProductId,
  onProductSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [epwFilters, setEpwFilters] = useState<EPWFiltersState>({
    modelo: 'all',
    comprimento: 'all',
    cor: 'all',
    acabamento: 'all',
  });
  const [visibleProducts, setVisibleProducts] = useState(20);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { shouldExcludeProduct } = useExclusions();
  const exclusionFilter = useCallback((codigo: string) => shouldExcludeProduct(codigo), [shouldExcludeProduct]);

  const {
    products,
    loading: productsLoading,
    error: productsError,
    totalCount,
    isConnected,
    connectionStatus,
    loadMore,
    hasMore,
    refresh,
  } = useOptimizedProductLoader(exclusionFilter, 50);

  const {
    modelos: apiModelos,
    acabamentos: apiAcabamentos,
    comprimentos: apiComprimentos,
    cores: apiCores,
    loading: attributesLoading,
    error: attributesError,
  } = useOptimizedAttributes();

  // Debounced search query
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Memoized filter functions
  const applyLocalFilters = useCallback((product: Product) => {
    // Search filter
    if (debouncedSearchQuery && product.epwOriginalCode && 
        !product.epwOriginalCode.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) {
      return false;
    }

    // EPW filters
    // EPW filters - removed tipo filter
    if (epwFilters.modelo !== 'all' && product.epwModelo && product.epwModelo.l !== epwFilters.modelo) return false;
    if (epwFilters.comprimento !== 'all' && product.epwComprimento && product.epwComprimento.l !== epwFilters.comprimento) return false;
    if (epwFilters.cor !== 'all' && product.epwCor && product.epwCor.l !== epwFilters.cor) return false;
    if (epwFilters.acabamento !== 'all' && product.epwAcabamento && product.epwAcabamento.l !== epwFilters.acabamento) return false;

    return true;
  }, [debouncedSearchQuery, epwFilters]);

  const filteredProducts = useMemo(() => {
    return products.filter(applyLocalFilters);
  }, [products, applyLocalFilters]);

  const displayProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleProducts);
  }, [filteredProducts, visibleProducts]);

  const handleEpwFilterChange = useCallback((filterType: keyof EPWFiltersState, value: string) => {
    setEpwFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setVisibleProducts(20); // Reset visible products when filters change
  }, []);

  const clearFilters = useCallback(() => {
    setEpwFilters({
      modelo: 'all',
      comprimento: 'all',
      cor: 'all',
      acabamento: 'all',
    });
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setVisibleProducts(20);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (displayProducts.length < filteredProducts.length) {
      // Load more from filtered results first
      setVisibleProducts(prev => prev + 20);
    } else if (hasMore && !productsLoading) {
      // Load more from API
      loadMore();
    }
  }, [displayProducts.length, filteredProducts.length, hasMore, productsLoading, loadMore]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !productsLoading) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [handleLoadMore, productsLoading]);

  const hasActiveFilters = useMemo(() => {
    return Object.values(epwFilters).some(value => value !== 'all') || debouncedSearchQuery.length > 0;
  }, [epwFilters, debouncedSearchQuery]);

  const showLoadMoreButton = displayProducts.length < filteredProducts.length || (hasMore && !productsLoading);

  return (
    <div className="space-y-4">
      {/* Search by EPW Code */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Pesquisar por código EPW..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
        {searchQuery !== debouncedSearchQuery && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* EPW Filters */}
      <EPWFilters
        filters={epwFilters}
        onFilterChange={handleEpwFilterChange}
        excludedCount={0}
      />

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Limpar Filtros
          </Button>
        </div>
      )}

      {/* Status */}
      <div className="text-sm text-muted-foreground">
        Status: {connectionStatus} | 
        {hasActiveFilters ? ` Filtrados: ${filteredProducts.length} | ` : ''}
        Exibindo: {displayProducts.length} de {filteredProducts.length} produtos
      </div>

      {/* Products Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
               <TableHead>Código do Produto</TableHead>
               <TableHead>Descrição</TableHead>
               <TableHead>Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productsError ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-destructive">
                  {productsError}
                  <div className="mt-2">
                    <Button variant="outline" size="sm" onClick={refresh}>
                      Tentar Novamente
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : displayProducts.length === 0 ? (
              productsLoading ? (
                // Loading skeletons
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    {hasActiveFilters ? "Nenhum produto encontrado com os filtros aplicados" : "Nenhum produto encontrado"}
                  </TableCell>
                </TableRow>
              )
            ) : (
              displayProducts.map((product) => (
                <TableRow 
                  key={product.id}
                  className={selectedProductId === product.id ? "bg-muted" : ""}
                >
                   <TableCell className="font-mono text-sm">
                     <div className="flex items-center gap-2">
                       {product.codigo || product.epwOriginalCode || product.modelo}
                      <Badge variant="secondary" className="text-xs">API</Badge>
                    </div>
                  </TableCell>
                  <TableCell>{product.descricao || product.acabamento}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant={selectedProductId === product.id ? "default" : "outline"}
                      onClick={() => onProductSelect(product.id, product)}
                    >
                      {selectedProductId === product.id ? "Selecionado" : "Selecionar"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Load More */}
      {showLoadMoreButton && (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={productsLoading}
            className="flex items-center gap-2"
          >
            {productsLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando...
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Carregar Mais
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};