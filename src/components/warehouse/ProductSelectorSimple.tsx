import React, { useState, useRef } from 'react';
import { Product } from '@/types/warehouse';
import { useApiProductsSimple } from '@/hooks/useApiProductsSimple';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, AlertCircle, Search, RefreshCw, FileText } from 'lucide-react';
import { ModeloSelect, ModeloSelectRef } from './ModeloSelect';
import { ComprimentoSelect, ComprimentoSelectRef } from './ComprimentoSelect';
import { CorSelect, CorSelectRef } from './CorSelect';

interface SimpleProduct {
  id: string;
  codigo: string;
  descricao: string;
}

interface ProductSelectorSimpleProps {
  selectedProductId: string | null;
  onProductSelect: (productId: string, product: Product) => void;
}

export const ProductSelectorSimple: React.FC<ProductSelectorSimpleProps> = ({
  selectedProductId,
  onProductSelect,
}) => {
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [selectedComprimento, setSelectedComprimento] = useState<string>('all');
  const [selectedCor, setSelectedCor] = useState<string>('all');
  const modeloSelectRef = useRef<ModeloSelectRef>(null);
  const comprimentoSelectRef = useRef<ComprimentoSelectRef>(null);
  const corSelectRef = useRef<CorSelectRef>(null);

  // Convert SimpleProduct to Product for compatibility
  const convertToProduct = (simpleProduct: SimpleProduct): Product => {
    return {
      id: simpleProduct.id,
      codigo: simpleProduct.codigo,
      descricao: simpleProduct.descricao,
      familia: 'API',
      modelo: simpleProduct.codigo || 'N/A',
      acabamento: 'N/A',
      cor: 'N/A',
      comprimento: 'N/A',
    };
  };

  const {
    products: simpleProducts,
    loading,
    error,
    currentPage,
    totalPages,
    totalCount,
    setCurrentPage,
    refresh,
    isConnected,
    connectionStatus,
    searchQuery,
    setSearchQuery
  } = useApiProductsSimple(
    selectedModel !== 'all' ? selectedModel : undefined,
    selectedComprimento !== 'all' ? selectedComprimento : undefined,
    selectedCor !== 'all' ? selectedCor : undefined
  );

  // Find the selected product
  const selectedProduct = selectedProductId 
    ? simpleProducts.find(p => p.id === selectedProductId)
    : null;

  // If a product is selected, show simplified view
  if (selectedProduct) {
    return (
      <div className="space-y-4">
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium mb-1">Produto Selecionado</h3>
                <p className="text-sm text-muted-foreground font-mono">{selectedProduct.codigo}</p>
                <p className="text-white">{selectedProduct.descricao}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onProductSelect('', {} as Product)}
                className="text-white border-white/20 hover:bg-white/10"
              >
                Alterar Produto
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* API Status */}
      <Card className="bg-white/10 border-white/20">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {loading ? 'Carregando...' : `${totalCount} produtos disponíveis`}
              </span>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="text-xs text-muted-foreground">
                  {isConnected ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
               <Button 
                onClick={() => {
                  refresh();
                  modeloSelectRef.current?.refresh();
                  comprimentoSelectRef.current?.refresh();
                  corSelectRef.current?.refresh();
                }}
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Atualizar
              </Button>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xs text-muted-foreground">{connectionStatus}</span>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          <ModeloSelect
            ref={modeloSelectRef}
            value={selectedModel}
            onValueChange={setSelectedModel}
          />
          <ComprimentoSelect
            ref={comprimentoSelectRef}
            value={selectedComprimento}
            onValueChange={setSelectedComprimento}
          />
          <CorSelect
            ref={corSelectRef}
            value={selectedCor}
            onValueChange={setSelectedCor}
          />
        </div>
        
        <div className="relative w-full max-w-md mx-auto">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por descrição..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
          />
        </div>
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
      ) : simpleProducts.length === 0 ? (
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-8 text-center">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
            <p className="text-white text-lg mb-2">Nenhum produto encontrado</p>
            <p className="text-white/60">Tente ajustar os termos de pesquisa</p>
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
                    <th className="text-left p-4 text-white font-medium">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {simpleProducts.map((simpleProduct, index) => (
                    <tr
                      key={simpleProduct.id || index} 
                      className={`border-b border-white/10 hover:bg-white/5 ${
                        selectedProductId === simpleProduct.id ? 'bg-white/10' : ''
                      }`}
                    >
                      <td className="p-4 text-white font-mono text-sm">
                        {simpleProduct.codigo}
                      </td>
                      <td className="p-4 text-white">
                        {simpleProduct.descricao}
                      </td>
                      <td className="p-4">
                        <Button
                          size="sm"
                          variant={selectedProductId === simpleProduct.id ? "default" : "outline"}
                          onClick={() => onProductSelect(simpleProduct.id, convertToProduct(simpleProduct))}
                        >
                          {selectedProductId === simpleProduct.id ? "Selecionado" : "Selecionar"}
                        </Button>
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
        <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
          {/* Previous Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="min-w-[80px]"
          >
            Anterior
          </Button>
          
          {/* Page Numbers */}
          <div className="flex gap-1 flex-wrap">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
              // Show first page, last page, current page and nearby pages
              const isVisible = 
                pageNum === 1 || 
                pageNum === totalPages || 
                (pageNum >= currentPage - 2 && pageNum <= currentPage + 2);
              
              // Show ellipsis
              const showEllipsisBefore = pageNum === currentPage - 3 && currentPage > 4;
              const showEllipsisAfter = pageNum === currentPage + 3 && currentPage < totalPages - 3;
              
              if (!isVisible && !showEllipsisBefore && !showEllipsisAfter) {
                return null;
              }
              
              if (showEllipsisBefore || showEllipsisAfter) {
                return (
                  <span key={`ellipsis-${pageNum}`} className="px-2 py-1 text-white/60">
                    ...
                  </span>
                );
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`min-w-[40px] ${
                    currentPage === pageNum 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-white/10'
                  }`}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          
          {/* Next Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="min-w-[80px]"
          >
            Próxima
          </Button>
          
          {/* Page Info */}
          <div className="text-white text-sm ml-4">
            Página {currentPage} de {totalPages}
          </div>
        </div>
      )}
    </div>
  );
};