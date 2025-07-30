import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApiProductsWithFilters } from '@/hooks/useApiProductsWithFilters';
import { useApiAttributes } from '@/hooks/useApiAttributes';
import { useExclusions } from '@/contexts/ExclusionsContext';
import { ApiFilters } from '@/services/apiService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Wifi, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '@/components/Header';
import { EPWFilters } from '@/components/warehouse/EPWFilters';
import { FilterDebugPanel } from '@/components/warehouse/FilterDebugPanel';
import { EPWCodeDebugger } from '@/components/warehouse/EPWCodeDebugger';
import { FilterCodeTester } from '@/components/warehouse/FilterCodeTester';
import { config } from '@/lib/config';
import productsBanner from '@/assets/epw-products-banner.jpg';

interface EPWFilters {
  tipo: string;
  modelo: string;
  comprimento: string;
  cor: string;
  acabamento: string;
}

const Products: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [epwFilters, setEpwFilters] = useState<EPWFilters>({
    tipo: 'all',
    modelo: 'all',
    comprimento: 'all',
    cor: 'all',
    acabamento: 'all',
  });
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showEpwDebugger, setShowEpwDebugger] = useState(false);
  
  const { shouldExcludeProduct, exclusions } = useExclusions();
  
  // Convert EPW filters to API filters
  const convertToApiFilters = (filters: EPWFilters): ApiFilters => ({
    Tipo: filters.tipo !== 'all' ? filters.tipo : undefined,
    Modelo: filters.modelo !== 'all' ? filters.modelo : undefined,
    Comprimento: filters.comprimento !== 'all' ? filters.comprimento : undefined,
    Cor: filters.cor !== 'all' ? filters.cor : undefined,
    Acabamento: filters.acabamento !== 'all' ? filters.acabamento : undefined,
  });

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
    activeFilters,
    setFilters,
    clearFilters: clearApiFilters,
  } = useApiProductsWithFilters(20, shouldExcludeProduct, convertToApiFilters(epwFilters));

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
    console.log('🎯 [Products] Filter change:', { field, value });
    const newEpwFilters = {
      ...epwFilters,
      [field]: value,
    };
    setEpwFilters(newEpwFilters);
    
    // Apply API filters immediately
    const apiFilters = convertToApiFilters(newEpwFilters);
    console.log('🎯 [Products] Converted API filters:', apiFilters);
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
    clearApiFilters();
  };

  // Count excluded products for display
  const excludedCount = 0; // This would be calculated differently if we had access to original data

  // Since we're using server-side filtering, we only need to filter by search query locally
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Only apply search filter locally - EPW filters are now handled server-side
      const matchesSearch = !searchQuery || 
        product.modelo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.acabamento.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.epwOriginalCode && product.epwOriginalCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.codigo && product.codigo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.descricao && product.descricao.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSearch;
    });
  }, [products, searchQuery]);

  const hasActiveFilters = Object.values(epwFilters).some(value => value !== 'all') || searchQuery.length > 0;
  const hasServerFilters = Object.values(epwFilters).some(value => value !== 'all');
  const hasLocalSearchFilter = searchQuery.length > 0;

  // Debug current filter state
  console.log('🎯 [Products] Current filter state:', {
    epwFilters,
    hasActiveFilters,
    hasServerFilters,
    hasLocalSearchFilter,
    activeApiFilters: activeFilters
  });

  // For display purposes - use filtered products when search is active, otherwise use all products
  const displayProducts = hasLocalSearchFilter ? filteredProducts : products;

  return (
    <div className="min-h-screen bg-warehouse-bg">
      <Header />
      <div className="p-4 sm:p-6 lg:p-8">
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
                  <span className="font-medium">{totalCount}</span> produtos da API
                  {loading && <Loader2 className="w-4 h-4 animate-spin ml-1" />}
                  {hasServerFilters && <span className="text-blue-400 text-xs">(filtrado no servidor)</span>}
                </div>
                <div className="text-white/70 text-xs">
                  Status: {connectionStatus}
                  {hasLocalSearchFilter && ` | Busca local: ${filteredProducts.length} resultados`}
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
            {config.isDevelopment && (
              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                <strong>Debug API Modelos:</strong> {
                  modelosLoading ? "Carregando..." :
                  modelosError ? `Erro: ${modelosError}` :
                  `${apiModelos.length} modelos carregados da API`
                }
                {apiModelos.length > 0 && (
                  <div>Primeiro modelo: {JSON.stringify(apiModelos[0])}</div>
                )}
              </div>
             )}

              {/* Debug Panel for Development */}
              {config.isDevelopment && (
                <div className="flex gap-2 flex-wrap">
                  <FilterDebugPanel
                    show={showDebugPanel}
                    onToggle={() => setShowDebugPanel(!showDebugPanel)}
                    apiCores={apiCores}
                    apiTipos={apiTipos}
                    apiAcabamentos={apiAcabamentos}
                    apiComprimentos={apiComprimentos}
                  />
                  <EPWCodeDebugger
                    show={showEpwDebugger}
                    onToggle={() => setShowEpwDebugger(!showEpwDebugger)}
                  />
                  <FilterCodeTester />
                </div>
              )}
           </div>

           {/* Products Table */}
          {displayProducts.length === 0 ? (
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
                      {displayProducts.map((product) => (
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 bg-card/20 rounded-lg">
              <div className="text-white text-sm">
                Página {currentPage} de {totalPages} ({totalCount} produtos total)
                {hasServerFilters && ' (filtrado no servidor)'}
                {hasLocalSearchFilter && ` - ${displayProducts.length} resultados da busca local`}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="text-white border-white hover:bg-white hover:text-black"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        disabled={loading}
                        className={currentPage === pageNum ? "" : "text-white border-white hover:bg-white hover:text-black"}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                  className="text-white border-white hover:bg-white hover:text-black"
                >
                  Próxima
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;