import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useCombinedProducts } from '@/hooks/useCombinedProducts';
import { useProductSearch } from '@/hooks/useProductSearch';
import { Button } from '@/components/ui/button';
import { SyncStatusIndicator } from '@/components/warehouse/SyncStatusIndicator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Home, LogOut, Search, Package, Users, Database, Wifi, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductDialog } from '@/components/warehouse/ProductDialog';
import { FamilyManagementDialog } from '@/components/warehouse/FamilyManagementDialog';
import { DatabaseResetDialog } from '@/components/warehouse/DatabaseResetDialog';
import { Product } from '@/types/warehouse';
import { CombinedProduct } from '@/hooks/useCombinedProducts';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EPWLogo from '@/components/ui/epw-logo';

const Products: React.FC = () => {
  const navigate = useNavigate();
  // No authentication needed
  // Temporarily use empty array to test API products without warehouse context
  const products: Product[] = [];
  const { combinedProducts, localCount, apiCount, loading, error, refresh } = useCombinedProducts(products);
  const {
    searchQuery,
    setSearchQuery,
    selectedSource,
    setSelectedSource,
    filteredProducts,
  } = useProductSearch(combinedProducts);
  const [showDialog, setShowDialog] = useState(false);
  const [showFamilyDialog, setShowFamilyDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CombinedProduct | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // No authentication required - direct access

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSource]);

  const handleDeleteProduct = (productId: string) => {
    // Temporarily disabled for testing
    console.log('Delete product:', productId);
    alert('Funcionalidade temporariamente desativada para teste da API');
  };

  // Calculate pagination
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-warehouse-bg p-4 sm:p-6 lg:p-8">
      {/* Debug Console */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
          <h3 className="text-white font-bold mb-2">🐛 DEBUG CONSOLE</h3>
          <div className="space-y-1">
            <div><span className="text-yellow-400">Local Products:</span> {products.length}</div>
            <div><span className="text-yellow-400">Combined Products:</span> {combinedProducts.length}</div>
            <div><span className="text-yellow-400">Filtered Products:</span> {filteredProducts.length}</div>
            <div><span className="text-yellow-400">Paginated Products:</span> {paginatedProducts.length}</div>
            <div><span className="text-yellow-400">Current Page:</span> {currentPage} of {totalPages}</div>
            <div><span className="text-yellow-400">Local Count:</span> {localCount}</div>
            <div><span className="text-yellow-400">API Count:</span> {apiCount}</div>
            <div><span className="text-yellow-400">Loading:</span> {loading ? 'true' : 'false'}</div>
            <div><span className="text-yellow-400">Error:</span> {error || 'none'}</div>
            <div><span className="text-yellow-400">Selected Source:</span> {selectedSource}</div>
            <div><span className="text-yellow-400">Search Query:</span> "{searchQuery}"</div>
            {combinedProducts.length > 0 && (
              <div>
                <span className="text-yellow-400">Sample Combined Product:</span>
                <pre className="text-xs mt-1 text-gray-300 overflow-auto max-h-32">
                  {JSON.stringify(combinedProducts[0], null, 2)}
                </pre>
              </div>
            )}
            {error && (
              <div className="text-red-400 mt-2">
                <span className="text-yellow-400">Full Error Details:</span>
                <div className="whitespace-pre-wrap">{error}</div>
              </div>
            )}
          </div>
        </div>
      </div>

       <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white border-white hover:bg-white hover:text-black order-3 sm:order-1"
          >
            <Home className="w-4 h-4" />
            Home
          </Button>
          
          
          <div className="flex flex-col items-center order-1 sm:order-2">
            <img 
              src="/lovable-uploads/ce6ad3d6-6728-414c-b327-428c5cd38f81.png" 
              alt="EPW Logo" 
              className="h-16 sm:h-20 lg:h-24 drop-shadow-lg mb-4"
            />
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-wider">
              PRODUTOS
            </h1>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 order-2 sm:order-3 w-full sm:w-auto">
            <Button
              onClick={() => setShowFamilyDialog(true)}
              variant="outline"
              className="flex items-center gap-2 justify-center text-white border-white hover:bg-white hover:text-black"
            >
              <Users className="w-4 h-4" />
              Gestão de Famílias
            </Button>
            <Button
              onClick={() => setShowResetDialog(true)}
              variant="destructive"
              className="flex items-center gap-2 justify-center"
            >
              <Database className="w-4 h-4" />
              Limpar BD
            </Button>
            <Button
              onClick={() => setShowDialog(true)}
              className="flex items-center gap-2 justify-center"
            >
              <Plus className="w-4 h-4" />
              Novo Produto
            </Button>
          </div>
        </div>

        {/* Contadores e status da API */}
        <div className="mb-6 space-y-4">
          
          {/* Contadores e status da API */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-white text-sm">
                <span className="font-medium">{localCount}</span> produtos locais
              </div>
              <div className="text-white text-sm flex items-center gap-1">
                <Wifi className="w-4 h-4" />
                <span className="font-medium">{apiCount}</span> produtos da API
                {loading && <Loader2 className="w-4 h-4 animate-spin ml-1" />}
              </div>
              {error && (
                <div className="text-destructive text-sm">
                  Erro: {error}
                </div>
              )}
            </div>
            
            <Button
              onClick={refresh}
              variant="outline"
              size="sm"
              disabled={loading}
              className="text-white border-white hover:bg-white hover:text-black"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh API'}
            </Button>
          </div>
          
          {/* Filtros e pesquisa */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por modelo, acabamento ou cor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedSource} onValueChange={(value) => setSelectedSource(value as "all" | "local" | "api")}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os produtos</SelectItem>
                <SelectItem value="local">Apenas locais</SelectItem>
                <SelectItem value="api">Apenas da API</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground text-lg mb-4">
                Nenhum produto encontrado
              </p>
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Produto
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 sm:p-4 font-medium text-sm sm:text-base">Código</th>
                      <th className="text-left p-3 sm:p-4 font-medium text-sm sm:text-base">Descrição</th>
                      <th className="text-left p-3 sm:p-4 font-medium text-sm sm:text-base">Origem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProducts.map((product) => (
                      <tr key={product.id} className="border-b hover:bg-muted/50">
                        <td className="p-3 sm:p-4 font-medium text-sm sm:text-base">{product.modelo}</td>
                        <td className="p-3 sm:p-4 text-sm sm:text-base">{product.acabamento}</td>
                        <td className="p-3 sm:p-4">
                          <Badge 
                            variant={product.source === 'api' ? 'default' : 'secondary'}
                            className="text-xs sm:text-sm flex items-center gap-1"
                          >
                            {product.source === 'api' ? (
                              <>
                                <Wifi className="w-3 h-3" />
                                API
                              </>
                            ) : (
                              'Local'
                            )}
                          </Badge>
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
              Mostrando {startIndex + 1}-{Math.min(endIndex, totalItems)} de {totalItems} produtos
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
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
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="text-white border-white hover:bg-white hover:text-black"
              >
                Próxima
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {showDialog && (
          <ProductDialog
            product={editingProduct}
            onClose={() => {
              setShowDialog(false);
              setEditingProduct(null);
            }}
          />
        )}

        {showFamilyDialog && (
          <FamilyManagementDialog
            onClose={() => setShowFamilyDialog(false)}
          />
        )}

        {showResetDialog && (
          <DatabaseResetDialog
            open={showResetDialog}
            onClose={() => setShowResetDialog(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Products;