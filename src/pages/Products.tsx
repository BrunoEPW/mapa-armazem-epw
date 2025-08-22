import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApiProductsWithFiltersServerSide } from '@/hooks/useApiProductsWithFiltersServerSide';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, AlertCircle, Database, Filter, RotateCcw, RefreshCw, FileText } from 'lucide-react';
import Header from '@/components/Header';
import { EPWFilters } from '@/components/warehouse/EPWFilters';
import { EPWDecoderTester } from '@/components/warehouse/EPWDecoderTester';
import { ProductsDebugPanel } from '@/components/warehouse/ProductsDebugPanel';
import Footer from '@/components/ui/Footer';
import productsBanner from '@/assets/epw-products-banner.jpg';

interface EPWFiltersState {
  modelo: string;
  comprimento: string;
  cor: string;
  acabamento: string;
}

const Products = () => {
  const [debugMode, setDebugMode] = useState(false);
  
  const [epwFilters, setEpwFilters] = useState<EPWFiltersState>({
    modelo: 'all',
    comprimento: 'all',
    cor: 'all',
    acabamento: 'all',
  });

  const [searchQuery, setSearchQuery] = useState('');

  const handleEpwFilterChange = (field: string, value: string) => {
    console.log(`🔍 [Products] EPW Filter change: ${field} = ${value}`);
    
    const newEpwFilters = {
      ...epwFilters,
      [field]: value,
    };
    setEpwFilters(newEpwFilters);
    
    // Convert EPW filters to API filters
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

  const {
    products,
    loading,
    error,
    currentPage,
    totalPages,
    totalCount,
    itemsPerPage,
    setCurrentPage,
    setFilters,
    clearFilters,
    refresh,
    connectionStatus,
    activeFilters
  } = useApiProductsWithFiltersServerSide();

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

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section - Full Width */}
      <div className="w-full">
        <button
          onClick={() => navigate('/')}
          className="relative group cursor-pointer w-full"
        >
          <img 
            src={productsBanner} 
            alt="Produtos Banner" 
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white tracking-wider">
              PRODUTOS
            </h1>
          </div>
        </button>
      </div>
      
      <main className="container mx-auto px-4 py-8">

        {/* API Status */}
        <div className="mb-6">
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {loading ? 'Carregando...' : `${totalCount} produtos disponíveis`}
                  </span>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${
                      connectionStatus === 'connected' ? 'bg-green-500' : 
                      connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className="text-xs text-muted-foreground">
                      {connectionStatus === 'connected' ? 'Online' : 
                       connectionStatus === 'connecting' ? 'Conectando...' : 'Offline'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setDebugMode(!debugMode)}
                    variant={debugMode ? "default" : "outline"}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    {debugMode ? "🐛 Debug ON" : "🐛 Debug OFF"}
                  </Button>
                  
                  <Button onClick={refresh} variant="outline" size="sm" className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Refresh API
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md mx-auto">
            <Database className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar produtos..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
            />
          </div>
        </div>

        {/* EPW Filters */}
        <div className="mb-6">
          <EPWFilters 
            filters={epwFilters} 
            onFilterChange={handleEpwFilterChange}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Button
            onClick={() => setDebugMode(!debugMode)}
            variant={debugMode ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-2"
          >
            {debugMode ? "🐛 Debug ON" : "🐛 Debug OFF"}
          </Button>
          
          <Button onClick={refresh} variant="outline" size="sm" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh API
          </Button>
        </div>

        {/* Analysis Panels */}
        {debugMode && (
          <div className="space-y-4 mb-6">
            <ProductsDebugPanel
              products={products}
              loading={loading}
              error={error || null}
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              itemsPerPage={itemsPerPage}
              connectionStatus={connectionStatus}
              activeFilters={activeFilters}
              debugMode={debugMode}
            />
          </div>
        )}

        {/* EPW Decoder Tester */}
        <div className="mb-6">
          <EPWDecoderTester />
        </div>

        {/* Products List */}
        {error ? (
          <Card className="bg-red-500/10 border-red-500/20">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-500 font-medium">Erro ao carregar produtos</p>
              <p className="text-red-400 text-sm mt-1">{error}</p>
            </CardContent>
          </Card>
        ) : loading ? (
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-white">Carregando produtos...</p>
            </CardContent>
          </Card>
        ) : products.length === 0 ? (
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-8 text-center">
              <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
              <p className="text-white text-lg mb-2">Nenhum produto encontrado</p>
              <p className="text-white/60">Tente ajustar os filtros ou termos de pesquisa</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left p-4 text-white font-medium">Código</th>
                      <th className="text-left p-4 text-white font-medium">Descrição</th>
                      <th className="text-left p-4 text-white font-medium">Modelo</th>
                      <th className="text-left p-4 text-white font-medium">Acabamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product, index) => (
                      <tr key={product.id || index} className="border-b border-white/10 hover:bg-white/5">
                        <td className="p-4 text-white font-mono text-sm">
                          {product.codigo || product.epwOriginalCode || 'N/A'}
                        </td>
                        <td className="p-4 text-white">
                          {product.descricao || 'N/A'}
                        </td>
                        <td className="p-4 text-white">
                          {product.modelo || 'N/A'}
                        </td>
                        <td className="p-4 text-white">
                          {product.acabamento || 'N/A'}
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
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            
            <span className="text-white text-sm">
              Página {currentPage} de {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Products;