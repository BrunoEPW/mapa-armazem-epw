import React, { useState, useMemo, useEffect } from 'react';
import { Product } from '@/types/warehouse';
import { useApiProductsWithFiltersServerSide } from '@/hooks/useApiProductsWithFiltersServerSide';
import { useEPWLocalFiltering } from '@/hooks/useEPWLocalFiltering';

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
    modelo: 'all',
    comprimento: 'all',
    cor: 'all',
    acabamento: 'all',
  });

  const { shouldExcludeProduct } = useExclusions();
  const exclusionFilter = (codigo: string) => shouldExcludeProduct(codigo);

  // Check if we have any EPW filters active
  const hasEPWFilters = Object.values(epwFilters).some(value => value && value !== 'all');
  
  // Convert EPW filters to API filters - only used when not using local filtering
  const convertToApiFilters = (epwFilters: EPWFilters): ApiFilters => {
    const extractCode = (filterValue: string): string | undefined => {
      if (!filterValue || filterValue === 'all') return undefined;
      // If the value contains " - " (format "l - d"), extract the code part
      if (filterValue.includes(' - ')) {
        return filterValue.split(' - ')[0];
      }
      // Otherwise use the value as is (for API attributes that are just codes)
      return filterValue;
    };

    return {
      Modelo: extractCode(epwFilters.modelo),
      Comprimento: extractCode(epwFilters.comprimento),
      Cor: extractCode(epwFilters.cor),
      Acabamento: extractCode(epwFilters.acabamento),
    };
  };

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
  } = useApiProductsWithFiltersServerSide(20, exclusionFilter);


  const handleEpwFilterChange = (filterType: keyof EPWFilters, value: string) => {
    const newEpwFilters = {
      ...epwFilters,
      [filterType]: value
    };
    setEpwFilters(newEpwFilters);
    
    // When EPW filters are used, we rely on local filtering only
    // No server-side API filters are applied
    const newHasEPWFilters = Object.values(newEpwFilters).some(v => v && v !== 'all');
    if (!newHasEPWFilters) {
      clearApiFilters(); // Clear server filters when no EPW filters
    }
  };

  const clearEpwFilters = () => {
    setEpwFilters({
      modelo: 'all',
      comprimento: 'all',
      cor: 'all',
      acabamento: 'all',
    });
    setSearchQuery('');
    clearApiFilters();
  };

  // Use local EPW filtering when EPW filters are active
  const { filteredProducts, filteredCount, totalLoadedCount } = useEPWLocalFiltering(
    products, 
    epwFilters, 
    searchQuery
  );

  const hasActiveFilters = Object.values(epwFilters).some(value => value !== 'all') || searchQuery.length > 0;
  const isUsingLocalFiltering = hasEPWFilters || searchQuery.length > 0;

  // Always use filtered products from EPW local filtering
  const displayProducts = filteredProducts;

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
        filters={epwFilters}
        onFilterChange={handleEpwFilterChange}
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
        Status: {connectionStatus}
        {isUsingLocalFiltering ? (
          <> | Filtros: <span className="font-semibold text-primary">Decodificação EPW Local</span> | 
          Resultados: {filteredCount} de {totalLoadedCount} carregados</>
        ) : (
          <> | Filtros: Servidor | Total: {totalCount} produtos</>
        )}
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
            {loading ? (
              <TableRow>
                 <TableCell colSpan={3} className="text-center py-8">
                  Carregando produtos...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-destructive">
                  {error}
                </TableCell>
              </TableRow>
            ) : displayProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
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
                  <TableCell>
                    <Button
                      size="sm"
                      variant={selectedProductId === product.id ? "default" : "outline"}
                      onClick={() => {
                        
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
            {isUsingLocalFiltering ? (
              `Exibindo ${displayProducts.length} resultados filtrados localmente`
            ) : (
              `Página ${currentPage} de ${totalPages} (todos os produtos)`
            )}
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