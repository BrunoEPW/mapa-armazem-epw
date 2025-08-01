import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApiProductsWithFilters } from '@/hooks/useApiProductsWithFilters';
import { useApiAttributes } from '@/hooks/useApiAttributes';
import { useExclusions } from '@/contexts/ExclusionsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Wifi, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '@/components/Header';
import { EPWFilters } from '@/components/warehouse/EPWFilters';
import Footer from '@/components/ui/Footer';
import productsBanner from '@/assets/epw-products-banner.jpg';

interface EPWFiltersState {
  tipo: string;
  modelo: string;
  comprimento: string;
  cor: string;
  acabamento: string;
}

const Products: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [epwFilters, setEpwFilters] = useState<EPWFiltersState>({
    tipo: 'all',
    modelo: 'all',
    comprimento: 'all',
    cor: 'all',
    acabamento: 'all',
  });
  
  const { shouldExcludeProduct, exclusions } = useExclusions();
  
  // Switch to local filtering due to proxy limitations with filtered requests
  const applyLocalFilters = (products: any[], filters: EPWFiltersState) => {
    if (products.length === 0) {
      console.log('⚠️ [Products] No products to filter');
      return [];
    }

    return products.filter((product, index) => {
      // Only log first few products to avoid spam
      const shouldLog = index < 2;
      
      if (shouldLog) {
        console.log(`🔍 [Products] Checking product ${index}:`, {
          codigo: product.codigo,
          epwTipo: product.epwTipo,
          epwModelo: product.epwModelo,
          epwCor: product.epwCor
        });
      }
      
      // Apply EPW filters locally - check each filter
      if (filters.tipo !== 'all') {
        const productTipo = product.epwTipo?.l;
        if (productTipo !== filters.tipo) {
          if (shouldLog) console.log(`❌ [Products] Tipo mismatch: ${productTipo} !== ${filters.tipo}`);
          return false;
        }
        if (shouldLog) console.log(`✅ [Products] Tipo match: ${productTipo}`);
      }
      
      if (filters.modelo !== 'all') {
        const productModelo = product.epwModelo?.l;
        if (productModelo !== filters.modelo) {
          if (shouldLog) console.log(`❌ [Products] Modelo mismatch: ${productModelo} !== ${filters.modelo}`);
          return false;
        }
        if (shouldLog) console.log(`✅ [Products] Modelo match: ${productModelo}`);
      }
      
      if (filters.cor !== 'all') {
        const productCor = product.epwCor?.l;
        if (productCor !== filters.cor) {
          if (shouldLog) console.log(`❌ [Products] Cor mismatch: ${productCor} !== ${filters.cor}`);
          return false;
        }
        if (shouldLog) console.log(`✅ [Products] Cor match: ${productCor}`);
      }
      
      if (filters.comprimento !== 'all') {
        const productComprimento = product.epwComprimento?.l;
        if (productComprimento !== filters.comprimento) {
          if (shouldLog) console.log(`❌ [Products] Comprimento mismatch: ${productComprimento} !== ${filters.comprimento}`);
          return false;
        }
        if (shouldLog) console.log(`✅ [Products] Comprimento match: ${productComprimento}`);
      }
      
      if (filters.acabamento !== 'all') {
        const productAcabamento = product.epwAcabamento?.l;
        if (productAcabamento !== filters.acabamento) {
          if (shouldLog) console.log(`❌ [Products] Acabamento mismatch: ${productAcabamento} !== ${filters.acabamento}`);
          return false;
        }
        if (shouldLog) console.log(`✅ [Products] Acabamento match: ${productAcabamento}`);
      }
      
      if (shouldLog) console.log(`✅ [Products] Product ${index} passed all filters`);
      return true;
    });
  };

  // Use hook without filters (load all data) and filter locally
  const {
    products,
    loading,
    error,
    currentPage,
    totalPages,
    totalCount,
    itemsPerPage,
    setCurrentPage,
    refresh,
    isConnected,
    connectionStatus,
  } = useApiProductsWithFilters(20, shouldExcludeProduct);

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
    refresh: refreshAttributes,
  } = useApiAttributes();

  const handleEpwFilterChange = (field: string, value: string) => {
    console.log(`🔍 [Products] Filter change: ${field} = ${value}`);
    
    const newEpwFilters = {
      ...epwFilters,
      [field]: value,
    };
    setEpwFilters(newEpwFilters);
    // Reset to first page when filters change
    setCurrentPage(1);
  };

  const clearEpwFilters = () => {
    setEpwFilters({
      tipo: 'all',
      modelo: 'all',
      comprimento: 'all',
      cor: 'all',
      acabamento: 'all',
    });
    setCurrentPage(1);
  };

  // Count excluded products for display
  const excludedCount = 0; // This would be calculated differently if we had access to original data

  // Apply filters locally to all loaded products
  const filteredByEpw = useMemo(() => {
    console.log(`🔄 [Products] Applying local filters:`, epwFilters);
    console.log(`📊 [Products] Total products to filter:`, products.length);
    
    if (products.length > 0) {
      const sample = products[0];
      console.log(`🔍 [Products] Sample product structure:`, {
        codigo: sample.codigo,
        hasEpwTipo: !!sample.epwTipo,
        epwTipo: sample.epwTipo,
        hasEpwModelo: !!sample.epwModelo,
        epwModelo: sample.epwModelo,
        hasEpwCor: !!sample.epwCor,
        epwCor: sample.epwCor,
        allKeys: Object.keys(sample)
      });
      
      // Check what filters are actually active
      const activeFilters = Object.entries(epwFilters).filter(([key, value]) => value !== 'all');
      console.log(`🎯 [Products] Active filters:`, activeFilters);
    }
    
    const filtered = applyLocalFilters(products, epwFilters);
    console.log(`✅ [Products] Filtered results count:`, filtered.length);
    return filtered;
  }, [products, epwFilters]);

  // Then apply search filter
  const filteredProducts = useMemo(() => {
    return filteredByEpw.filter(product => {
      const matchesSearch = !searchQuery || 
        product.codigo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.descricao?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.modelo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.acabamento?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.epwOriginalCode && product.epwOriginalCode.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSearch;
    });
  }, [filteredByEpw, searchQuery]);

  // Pagination for local filtering
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const totalFilteredPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const hasActiveFilters = Object.values(epwFilters).some(value => value !== 'all') || searchQuery.length > 0;

  return (
    <div className="min-h-screen bg-warehouse-bg flex flex-col">
      <Header />
      <div className="p-4 sm:p-6 lg:p-8 flex-1">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col items-center mb-6 sm:mb-8">
            <button
              onClick={() => navigate('/')}
              className="relative w-full max-w-2xl transition-all duration-500 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-lg animate-fade-in"
            >
              <img 
                src={productsBanner} 
                alt="Products Banner" 
                className="w-full h-32 sm:h-40 object-cover rounded-lg shadow-lg transition-all duration-300"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-wider drop-shadow-lg">
                  PRODUTOS
                </h1>
              </div>
            </button>
          </div>

          {/* API Status and Search */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="text-white text-sm flex items-center gap-1">
                  <Wifi className={`w-4 h-4 ${isConnected ? 'text-green-400' : 'text-red-400'}`} />
                  <span className="font-medium">Produtos: {filteredProducts.length}</span>
                  {loading && <Loader2 className="w-4 h-4 animate-spin ml-1" />}
                </div>
                <div className="text-white/70 text-xs">
                  Status: {connectionStatus}
                  {hasActiveFilters && ` | Filtros aplicados localmente`}
                  {exclusions.enabled && exclusions.prefixes.length > 0 && (
                    <span className="text-yellow-400"> | Exclusões ativas: {exclusions.prefixes.join(', ')}</span>
                  )}
                </div>
                {error && (
                  <div className="text-destructive text-sm">
                    {error}
                  </div>
                )}
              </div>
              
              <Button
                onClick={async () => {
                  // Clear API cache and refresh
                  const { apiService } = await import('@/services/apiService');
                  apiService.clearCache();
                  refresh();
                }}
                variant="outline"
                size="sm"
                disabled={loading}
                className="text-white border-white hover:bg-white hover:text-black"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh API'}
              </Button>
            </div>
            
            {/* Search */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por código ou descrição..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* EPW Filters */}
          <div className="space-y-2">
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
              excludedCount={excludedCount}
            />
          </div>

          {/* Products Table */}
          {paginatedProducts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground text-lg">
                  {loading ? 'Carregando produtos da API...' : 
                   hasActiveFilters ? 'Nenhum produto encontrado com os filtros aplicados' : 
                   'Nenhum produto encontrado na página atual'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 sm:p-4 font-medium text-sm sm:text-base">Código do Produto</th>
                        <th className="text-left p-3 sm:p-4 font-medium text-sm sm:text-base">Descrição</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedProducts.map((product) => (
                        <tr key={product.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 sm:p-4 font-medium text-sm sm:text-base font-mono">
                            {product.codigo || product.epwOriginalCode || product.modelo}
                          </td>
                          <td className="p-3 sm:p-4 text-sm sm:text-base">
                            {product.descricao || product.acabamento}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pagination - show only if we have filtered results or multiple pages */}
          {(filteredProducts.length > itemsPerPage || totalFilteredPages > 1) && (
            <div className="flex justify-center mt-6">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="px-3 py-1 text-sm">
                  Página {currentPage} de {totalFilteredPages} ({filteredProducts.length} produtos)
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalFilteredPages, currentPage + 1))}
                  disabled={currentPage === totalFilteredPages}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Products;