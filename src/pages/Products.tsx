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
import { EPWDecoderTester } from '@/components/warehouse/EPWDecoderTester';

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
  const [showEPWTester, setShowEPWTester] = useState(false);
  
  const [epwFilters, setEpwFilters] = useState<EPWFiltersState>({
    tipo: 'all',
    modelo: 'all',
    comprimento: 'all',
    cor: 'all',
    acabamento: 'all',
  });
  
  const { shouldExcludeProduct, exclusions } = useExclusions();
  
  // Switch to local filtering - use actual product properties, not EPW decoded ones
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
          familia: product.familia,
          modelo: product.modelo,
          acabamento: product.acabamento,
          cor: product.cor,
          hasEpwProps: !!(product.epwTipo || product.epwModelo)
        });
      }
      
      // Use the actual product properties that exist, not EPW decoded ones
      // Based on the API response format and useApiAttributes results
      
      if (filters.tipo !== 'all') {
        const extractedTipo = extractTipoFromCodigo(product.codigo);
        
        if (shouldLog) {
          console.log(`🔍 [Products] Tipo check for ${product.codigo}:`, {
            filterTipo: filters.tipo,
            extractedTipo,
            startsWith: {
              A: product.codigo?.startsWith('A'),
              B: product.codigo?.startsWith('B'),
              C: product.codigo?.startsWith('C'),
              X: product.codigo?.startsWith('X')
            }
          });
        }
        
        // Strict filtering: only match exact type from first letter of code
        if (extractedTipo !== filters.tipo) {
          if (shouldLog) console.log(`❌ [Products] Tipo mismatch: extracted '${extractedTipo}' != filter '${filters.tipo}'`);
          return false;
        }
        if (shouldLog) console.log(`✅ [Products] Tipo match for ${filters.tipo}`);
      }
      
      if (filters.modelo !== 'all') {
        // Match against modelo field or codigo pattern
        const matchesModelo = product.modelo?.includes(filters.modelo) ||
                             product.codigo?.includes(filters.modelo) ||
                             extractModeloFromCodigo(product.codigo) === filters.modelo;
        if (!matchesModelo) {
          if (shouldLog) console.log(`❌ [Products] Modelo mismatch for ${filters.modelo}`);
          return false;
        }
        if (shouldLog) console.log(`✅ [Products] Modelo match for ${filters.modelo}`);
      }
      
      if (filters.cor !== 'all') {
        const matchesCor = product.cor?.includes(filters.cor) ||
                          product.codigo?.includes(filters.cor) ||
                          extractCorFromCodigo(product.codigo) === filters.cor;
        if (!matchesCor) {
          if (shouldLog) console.log(`❌ [Products] Cor mismatch for ${filters.cor}`);
          return false;
        }
        if (shouldLog) console.log(`✅ [Products] Cor match for ${filters.cor}`);
      }
      
      if (filters.acabamento !== 'all') {
        const matchesAcabamento = product.acabamento?.includes(filters.acabamento) ||
                                 product.codigo?.includes(filters.acabamento) ||
                                 extractAcabamentoFromCodigo(product.codigo) === filters.acabamento;
        if (!matchesAcabamento) {
          if (shouldLog) console.log(`❌ [Products] Acabamento mismatch for ${filters.acabamento}`);
          return false;
        }
        if (shouldLog) console.log(`✅ [Products] Acabamento match for ${filters.acabamento}`);
      }
      
      if (filters.comprimento !== 'all') {
        const matchesComprimento = product.comprimento?.toString().includes(filters.comprimento) ||
                                  product.codigo?.includes(filters.comprimento) ||
                                  extractComprimentoFromCodigo(product.codigo) === filters.comprimento;
        if (!matchesComprimento) {
          if (shouldLog) console.log(`❌ [Products] Comprimento mismatch for ${filters.comprimento}`);
          return false;
        }
        if (shouldLog) console.log(`✅ [Products] Comprimento match for ${filters.comprimento}`);
      }
      
      if (shouldLog) console.log(`✅ [Products] Product ${index} passed all filters`);
      return true;
    });
  };

  // Helper functions to extract attributes from product codes
  const extractTipoFromCodigo = (codigo: string): string | null => {
    // Look for common patterns in EPW codes
    if (!codigo) return null;
    
    // Distinct EPW types based on starting letter
    if (codigo.startsWith('A')) return 'A'; // Deck + Clip + Travessa Alumínio
    if (codigo.startsWith('B')) return 'B'; // Deck + Clip + Sarrafo Compósito
    if (codigo.startsWith('C')) return 'C'; // Deck + Clip
    
    // Additional patterns
    if (codigo.includes('AF') || codigo.includes('CF') || codigo.includes('BF')) return 'C'; // Deck + Clip
    if (codigo.includes('ML')) return 'ML'; // Metro Linear
    if (codigo.includes('RF') || codigo.includes('RS')) return 'R'; // Régua
    if (codigo.startsWith('H')) return 'H'; // Calha (moved from C)
    
    return null;
  };

  const extractModeloFromCodigo = (codigo: string): string | null => {
    if (!codigo) return null;
    // Extract modelo patterns - this needs to match API attributes
    if (codigo.includes('3F') || codigo.includes('F3')) return '3F';
    if (codigo.includes('XR') || codigo.includes('RX')) return 'XR';
    if (codigo.includes('TF') || codigo.includes('FT')) return 'TF';
    return null;
  };

  const extractCorFromCodigo = (codigo: string): string | null => {
    if (!codigo) return null;
    // Common color codes in EPW
    if (codigo.includes('AL')) return 'A'; // Antracite
    if (codigo.includes('BL')) return 'B'; // Bronze
    if (codigo.includes('CL')) return 'C'; // Chocolate
    if (codigo.includes('LL')) return 'L'; // Camel
    if (codigo.includes('VL')) return 'V'; // Vulcan
    return null;
  };

  const extractAcabamentoFromCodigo = (codigo: string): string | null => {
    if (!codigo) return null;
    // Common finish patterns
    if (codigo.includes('G01') || codigo.includes('GE')) return 'G'; // G/E
    if (codigo.includes('L01') || codigo.includes('LS')) return 'L'; // L/S
    if (codigo.includes('T01') || codigo.includes('TL')) return 'T'; // TL/TS
    return null;
  };

  const extractComprimentoFromCodigo = (codigo: string): string | null => {
    if (!codigo) return null;
    // Extract length from patterns like "23", "32", "28", etc.
    const lengthMatch = codigo.match(/(\d{2,4})(?:mm)?/);
    return lengthMatch ? lengthMatch[1] : null;
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

          {/* EPW Tools */}
          <div className="mb-4 flex gap-2">
            <EPWDecoderTester 
              show={showEPWTester} 
              onToggle={() => setShowEPWTester(!showEPWTester)} 
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
            <div className="flex flex-col items-center mt-6 space-y-2">
              <div className="text-sm text-muted-foreground">
                Exibindo {Math.min(itemsPerPage, paginatedProducts.length)} de {filteredProducts.length} produtos 
                (página {currentPage} de {totalFilteredPages})
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
                  {Array.from({ length: Math.min(5, totalFilteredPages) }, (_, i) => {
                    let pageNum;
                    if (totalFilteredPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalFilteredPages - 2) {
                      pageNum = totalFilteredPages - 4 + i;
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
                  onClick={() => setCurrentPage(Math.min(totalFilteredPages, currentPage + 1))}
                  disabled={currentPage === totalFilteredPages}
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