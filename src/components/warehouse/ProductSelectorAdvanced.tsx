import React, { useState, useMemo, useEffect } from 'react';
import { Product } from '@/types/warehouse';
import { useApiProductsPaginated } from '@/hooks/useApiProductsPaginated';
import { useApiAttributes } from '@/hooks/useApiAttributes';
import { useExclusions } from '@/contexts/ExclusionsContext';
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

  const {
    products,
    loading,
    error,
    currentPage,
    totalPages,
    totalCount,
    setCurrentPage,
    connectionStatus,
  } = useApiProductsPaginated(20, exclusionFilter);

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
    setEpwFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
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
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // EPW code search
      const matchesEpwSearch = !searchQuery || 
        (product.epwOriginalCode && product.epwOriginalCode.toLowerCase().includes(searchQuery.toLowerCase()));

      // EPW filters
      const matchesTipo = epwFilters.tipo === 'all' || 
        (product.epwTipo && product.epwTipo.l === epwFilters.tipo);

      const matchesModelo = epwFilters.modelo === 'all' || 
        (product.epwModelo && product.epwModelo.l === epwFilters.modelo);

      const matchesComprimento = epwFilters.comprimento === 'all' || 
        (product.epwComprimento && product.epwComprimento.l === epwFilters.comprimento);

      const matchesCor = epwFilters.cor === 'all' || 
        (product.epwCor && product.epwCor.l === epwFilters.cor);

      const matchesAcabamento = epwFilters.acabamento === 'all' || 
        (product.epwAcabamento && product.epwAcabamento.l === epwFilters.acabamento);

      return matchesEpwSearch && matchesTipo && matchesModelo && 
             matchesComprimento && matchesCor && matchesAcabamento;
    });
  }, [products, searchQuery, epwFilters]);

  // Pagination for filtered products
  const [localPage, setLocalPage] = useState(1);
  const productsPerPage = 20;
  const totalFilteredPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (localPage - 1) * productsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + productsPerPage);

  const hasActiveFilters = Object.values(epwFilters).some(value => value !== 'all') || searchQuery.length > 0;

  // Reset local page when filters change
  useEffect(() => {
    setLocalPage(1);
  }, [searchQuery, epwFilters]);

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
        {hasActiveFilters ? ` Filtrados: ${filteredProducts.length} | ` : ''} 
        Total: {totalCount} produtos
      </div>

      {/* Products Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código EPW</TableHead>
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
                <TableCell colSpan={7} className="text-center py-8">
                  Carregando produtos...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-destructive">
                  {error}
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  {hasActiveFilters ? "Nenhum produto encontrado com os filtros aplicados" : "Nenhum produto encontrado"}
                </TableCell>
              </TableRow>
            ) : (
              paginatedProducts.map((product) => (
                <TableRow 
                  key={product.id}
                  className={selectedProductId === product.id ? "bg-muted" : ""}
                >
                  <TableCell className="font-mono text-sm">
                    <div className="flex items-center gap-2">
                      {product.epwOriginalCode || product.modelo}
                      <Badge variant="secondary" className="text-xs">API</Badge>
                    </div>
                  </TableCell>
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
      {(totalFilteredPages > 1 && hasActiveFilters) ? (
        // Local pagination for filtered results
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Página {localPage} de {totalFilteredPages} (produtos filtrados)
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocalPage(localPage - 1)}
              disabled={localPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocalPage(localPage + 1)}
              disabled={localPage === totalFilteredPages}
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : totalPages > 1 && !hasActiveFilters ? (
        // API pagination for unfiltered results
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages} (API)
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
      ) : null}
    </div>
  );
};