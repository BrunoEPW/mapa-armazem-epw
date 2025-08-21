import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApiProductsWithFiltersServerSide } from '@/hooks/useApiProductsWithFiltersServerSide';
import { useExclusions } from '@/contexts/ExclusionsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Wifi, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '@/components/Header';
import { EPWFilters } from '@/components/warehouse/EPWFilters';
import { EPWDecoderTester } from '@/components/warehouse/EPWDecoderTester';
import { mockProducts } from '@/data/mock-data';
import { DebugPanel } from '@/components/ui/DebugPanel';

import Footer from '@/components/ui/Footer';
import productsBanner from '@/assets/epw-products-banner.jpg';

interface EPWFiltersState {
  modelo: string;
  comprimento: string;
  cor: string;
  acabamento: string;
}

const Products: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showEPWTester, setShowEPWTester] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  
  const [epwFilters, setEpwFilters] = useState<EPWFiltersState>({
    modelo: 'all',
    comprimento: 'all',
    cor: 'all',
    acabamento: 'all',
  });
  
  const { shouldExcludeProduct, exclusions } = useExclusions();

  // Create exclusion filter that can be disabled for debugging
  const exclusionFilter = (codigo: string): boolean => {
    if (debugMode) {
      console.log(`🐛 [DEBUG] Exclusions disabled - NOT excluding product: ${codigo}`);
      return false; // Don't exclude anything in debug mode
    }
    const shouldExclude = shouldExcludeProduct(codigo);
    if (shouldExclude) {
      console.log(`🚫 [Products] Excluding product: ${codigo} (matches exclusion prefixes)`);
    }
    return shouldExclude;
  };

  // Use server-side filtering and pagination
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
    clearFilters,
  } = useApiProductsWithFiltersServerSide(20, exclusionFilter);

  const handleEpwFilterChange = (field: string, value: string) => {
    console.log(`🔍 [Products] Filter change: ${field} = ${value}`);
    
    const newEpwFilters = {
      ...epwFilters,
      [field]: value,
    };
    setEpwFilters(newEpwFilters);
    
    // Convert EPW filters to API filters and send to server
    const apiFilters: any = {};
    Object.entries(newEpwFilters).forEach(([key, val]) => {
      if (val && val !== 'all') {
        apiFilters[key] = val;
      }
    });
    
    // Add search query to filters if present
    if (searchQuery.trim()) {
      apiFilters.search = searchQuery.trim();
    }
    
    console.log(`🔍 [Products] Sending API filters:`, apiFilters);
    setFilters(apiFilters);
  };

  const clearEpwFilters = () => {
    setEpwFilters({
      modelo: 'all',
      comprimento: 'all',
      cor: 'all',
      acabamento: 'all',
    });
    setSearchQuery('');
    clearFilters();
  };

  // Handle search query changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    // Convert EPW filters to API filters and add search
    const apiFilters: any = {};
    Object.entries(epwFilters).forEach(([key, val]) => {
      if (val && val !== 'all') {
        apiFilters[key] = val;
      }
    });
    
    if (value.trim()) {
      apiFilters.search = value.trim();
    }
    
    console.log(`🔍 [Products] Search changed, sending API filters:`, apiFilters);
    setFilters(apiFilters);
  };

  // Count excluded products for display
  const excludedCount = 0;

  

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
                  <span className="font-medium">Produtos: {products.length} de {totalCount}</span>
                  {loading && <Loader2 className="w-4 h-4 animate-spin ml-1" />}
                </div>
                <div className="text-white/70 text-xs">
                  Status: {connectionStatus}
                  {exclusions.enabled && exclusions.prefixes.length > 0 && (
                    <span className="text-yellow-400"> | Exclusões ativas: {exclusions.prefixes.join(', ')}</span>
                  )}
                  {debugMode && <span className="text-green-400"> | 🐛 DEBUG: Exclusões desabilitadas</span>}
                </div>
                {error && (
                  <div className="text-destructive text-sm">
                    {error}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => setDebugMode(!debugMode)}
                  variant={debugMode ? "default" : "outline"}
                  size="sm"
                  className={debugMode ? "bg-green-600 hover:bg-green-700" : "text-white border-white hover:bg-white hover:text-black"}
                >
                  🐛 Debug {debugMode ? 'ON' : 'OFF'}
                </Button>
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
            </div>
            
            {/* Search */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por código ou descrição..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
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
            excludedCount={excludedCount}
          />
          </div>

          {/* EPW Tools */}
          <div className="mb-4 flex gap-2">
            <EPWDecoderTester 
              show={showEPWTester} 
              onToggle={() => setShowEPWTester(!showEPWTester)} 
            />
          </div>

          {/* Products Table */}
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-muted-foreground text-lg">A carregar produtos</p>
                </div>
              </CardContent>
            </Card>
          ) : products.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="space-y-4">
                  <p className="text-muted-foreground text-lg">
                    {Object.keys(activeFilters).length > 0 ? 'Nenhum produto encontrado com os filtros aplicados' : 
                     'Nenhum produto encontrado'}
                  </p>
                  {exclusions.enabled && exclusions.prefixes.length > 0 && !debugMode && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800 text-sm font-medium">
                        🚫 Possível causa: {exclusions.prefixes.length} exclusões ativas podem estar filtrando todos os produtos
                      </p>
                      <p className="text-yellow-700 text-xs mt-1">
                        Prefixos excluídos: {exclusions.prefixes.join(', ')}
                      </p>
                      <Button
                        onClick={() => setDebugMode(true)}
                        variant="outline"
                        size="sm"
                        className="mt-2 text-yellow-800 border-yellow-300 hover:bg-yellow-100"
                      >
                        🐛 Ativar modo debug (desabilitar exclusões temporariamente)
                      </Button>
                    </div>
                  )}
                </div>
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
                      {products.map((product) => (
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center mt-6 space-y-2">
              <div className="text-sm text-muted-foreground">
                Exibindo {products.length} de {totalCount} produtos 
                (página {currentPage} de {totalPages})
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
                
                <div className="flex items-center space-x-1">
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
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1"
                >
                  Próxima
                  <ChevronRight className="w-4 h-4" />
                </Button>
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