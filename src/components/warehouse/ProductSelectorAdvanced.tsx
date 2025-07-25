import React, { useState, useMemo, useEffect } from 'react';
import { Product } from '@/types/warehouse';
import { useApiProductsWithFilters } from '@/hooks/useApiProductsWithFilters';
import { useApiAttributes } from '@/hooks/useApiAttributes';
import { useExclusions } from '@/contexts/ExclusionsContext';
import { ApiFilters } from '@/services/apiService';
import { EPWFilters } from './EPWFilters';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductSelectorAdvancedProps {
  selectedProductId: string | null;
  onProductSelect: (productId: string, product: Product) => void;
}

interface EPWFilters {
  tipo: string;
  modelo: string;
  comprimento: string;
  cor: string;
  acabamento: string;
}

export const ProductSelectorAdvanced: React.FC<ProductSelectorAdvancedProps> = ({
  selectedProductId,
  onProductSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [epwFilters, setEpwFilters] = useState<EPWFilters>({
    tipo: 'all',
    modelo: 'all',
    comprimento: 'all',
    cor: 'all',
    acabamento: 'all',
  });

  const { shouldExcludeProduct } = useExclusions();
  const exclusionFilter = (codigo: string) => shouldExcludeProduct(codigo);

  // Convert EPW filters to API filters
  const convertToApiFilters = (epwFilters: EPWFilters): ApiFilters => ({
    Tipo: epwFilters.tipo !== 'all' ? epwFilters.tipo : undefined,
    Modelo: epwFilters.modelo !== 'all' ? epwFilters.modelo : undefined,
    Comprimento: epwFilters.comprimento !== 'all' ? epwFilters.comprimento : undefined,
    Cor: epwFilters.cor !== 'all' ? epwFilters.cor : undefined,
    Acabamento: epwFilters.acabamento !== 'all' ? epwFilters.acabamento : undefined,
  });

  const {
    products,
    loading,
    error,
    currentPage,
    totalPages,
    totalCount,
    setCurrentPage,
    connectionStatus,
    activeFilters,
    setFilters,
    clearFilters: clearApiFilters,
  } = useApiProductsWithFilters(20, exclusionFilter);

  const {
    modelos: apiModelos,
    tipos: apiTipos,
    acabamentos: apiAcabamentos,
    comprimentos: apiComprimentos,
    cores: apiCores,
    modelosLoading,
    tiposLoading,
    acabamentosLoading,
    comprimentosLoading,
    coresLoading,
    modelosError,
    tiposError,
    acabamentosError,
    comprimentosError,
    coresError,
  } = useApiAttributes();

  const handleEpwFilterChange = (filterType: keyof EPWFilters, value: string) => {
    const newEpwFilters = {
      ...epwFilters,
      [filterType]: value
    };
    setEpwFilters(newEpwFilters);
    
    // Apply API filters immediately
    const apiFilters = convertToApiFilters(newEpwFilters);
    setFilters(apiFilters);
  };

  const clearEpwFilters = () => {
    setEpwFilters({
      tipo: 'all',
      modelo: 'all',
      comprimento: 'all',
      cor: 'all',
      acabamento: 'all',
    });
    setSearchQuery('');
    clearApiFilters();
  };

  // Since we're using server-side filtering, we only need to filter by search query locally
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // EPW code search (local filter)
      const matchesEpwSearch = !searchQuery || 
        (product.epwOriginalCode && product.epwOriginalCode.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesEpwSearch;
    });
  }, [products, searchQuery]);

  const hasActiveFilters = Object.values(epwFilters).some(value => value !== 'all') || searchQuery.length > 0;
  const hasServerFilters = Object.values(epwFilters).some(value => value !== 'all');
  const hasLocalSearchFilter = searchQuery.length > 0;

  // For display purposes - use filtered products when search is active, otherwise use all products
  const displayProducts = hasLocalSearchFilter ? filteredProducts : products;

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
      </div>

      {/* EPW Filters */}
      <EPWFilters
        products={products}
        filters={epwFilters}
        onFilterChange={handleEpwFilterChange}
        apiModelos={apiModelos}
        apiTipos={apiTipos}
        apiAcabamentos={apiAcabamentos}
        apiComprimentos={apiComprimentos}
        apiCores={apiCores}
        modelosLoading={modelosLoading}
        tiposLoading={tiposLoading}
        acabamentosLoading={acabamentosLoading}
        comprimentosLoading={comprimentosLoading}
        coresLoading={coresLoading}
        modelosError={modelosError}
        tiposError={tiposError}
        acabamentosError={acabamentosError}
        comprimentosError={comprimentosError}
        coresError={coresError}
        excludedCount={0}
      />

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={clearEpwFilters}>
            Limpar Filtros
          </Button>
        </div>
      )}

      {/* Connection Status */}
      <div className="text-sm text-muted-foreground">
        Status: {connectionStatus} | 
        {hasLocalSearchFilter ? ` Busca local: ${filteredProducts.length} | ` : ''}
        {hasServerFilters ? ' Filtros aplicados no servidor | ' : ''}
        Total: {totalCount} produtos
      </div>

      {/* Products Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
               <TableHead>Código do Produto</TableHead>
               <TableHead>Descrição</TableHead>
               <TableHead>Tipo</TableHead>
               <TableHead>Modelo</TableHead>
               <TableHead>Comprimento</TableHead>
               <TableHead>Cor</TableHead>
               <TableHead>Acabamento</TableHead>
               <TableHead>Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                 <TableCell colSpan={8} className="text-center py-8">
                  Carregando produtos...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-destructive">
                  {error}
                </TableCell>
              </TableRow>
            ) : displayProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  {hasActiveFilters ? "Nenhum produto encontrado com os filtros aplicados" : "Nenhum produto encontrado"}
                </TableCell>
              </TableRow>
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
                  <TableCell>{product.epwTipo?.d || 'N/A'}</TableCell>
                  <TableCell>{product.epwModelo?.d || product.modelo}</TableCell>
                  <TableCell>{product.epwComprimento?.d || 'N/A'}</TableCell>
                  <TableCell>{product.epwCor?.d || 'N/A'}</TableCell>
                  <TableCell>{product.epwAcabamento?.d || 'N/A'}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant={selectedProductId === product.id ? "default" : "outline"}
                      onClick={() => {
                        console.log('=== PRODUCT SELECT DEBUG ===');
                        console.log('Product clicked:', product);
                        console.log('Product ID:', product.id);
                        console.log('Current selectedProductId:', selectedProductId);
                        console.log('Calling onProductSelect with:', product.id, product);
                        onProductSelect(product.id, product);
                        console.log('onProductSelect called successfully');
                      }}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages} 
            {hasServerFilters ? ' (filtrado no servidor)' : ' (todos os produtos)'}
            {hasLocalSearchFilter ? ` - ${displayProducts.length} resultados da busca local` : ''}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};