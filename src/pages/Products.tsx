import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApiProductsPaginated } from '@/hooks/useApiProductsPaginated';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Home, Wifi, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '@/components/Header';

const Products: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
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
  } = useApiProductsPaginated(20);

  // Filter products based on search query (client-side filtering for current page)
  const filteredProducts = products.filter(product =>
    product.modelo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.acabamento.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + filteredProducts.length;

  return (
    <div className="min-h-screen bg-warehouse-bg">
      <Header />
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col items-center mb-6 sm:mb-8">
            <img 
              src="/lovable-uploads/e3f287c7-c1ee-485f-8e58-cb96b7ff55b3.png" 
              alt="EPW Logo" 
              className="h-16 sm:h-20 lg:h-24 drop-shadow-lg mb-4"
            />
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-wider">
              PRODUTOS DA API
            </h1>
          </div>

          {/* Navigation */}
          <div className="flex justify-center mb-6">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="flex items-center gap-2 text-white border-white hover:bg-white hover:text-black"
            >
              <Home className="w-4 h-4" />
              Página Inicial
            </Button>
          </div>

          {/* API Status and Search */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-white text-sm flex items-center gap-1">
                  <Wifi className="w-4 h-4" />
                  <span className="font-medium">{totalCount}</span> produtos da API
                  {loading && <Loader2 className="w-4 h-4 animate-spin ml-1" />}
                </div>
                {error && (
                  <div className="text-destructive text-sm">
                    Erro: {error}
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

          {/* Products Table */}
          {filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground text-lg">
                  {loading ? 'Carregando produtos da API...' : 
                   searchQuery ? 'Nenhum produto encontrado para a pesquisa' : 
                   'Nenhum produto encontrado na página atual'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[400px]">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 sm:p-4 font-medium text-sm sm:text-base">Código</th>
                        <th className="text-left p-3 sm:p-4 font-medium text-sm sm:text-base">Descrição</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 sm:p-4 font-medium text-sm sm:text-base font-mono">{product.modelo}</td>
                          <td className="p-3 sm:p-4 text-sm sm:text-base">{product.acabamento}</td>
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
                {searchQuery && ` - ${filteredProducts.length} resultados na página`}
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