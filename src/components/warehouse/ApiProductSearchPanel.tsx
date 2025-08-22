import React, { useState, useRef } from 'react';
import { useApiProductsSimple } from '@/hooks/useApiProductsSimple';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, AlertCircle, Search, RefreshCw, FileText } from 'lucide-react';
import { ModeloSelect, ModeloSelectRef } from '@/components/warehouse/ModeloSelect';

const ApiProductSearchPanel = () => {
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const modeloSelectRef = useRef<ModeloSelectRef>(null);

  const {
    products,
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
  } = useApiProductsSimple();

  return (
    <div className="space-y-6">
      {/* API Status */}
      <Card className="bg-white/10 border-white/20">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/70">
                {loading ? 'Carregando...' : `${totalCount} produtos disponíveis`}
              </span>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="text-xs text-white/60">
                  {isConnected ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => {
                  refresh();
                  modeloSelectRef.current?.refresh();
                }} 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <RefreshCw className="w-4 h-4" />
                Atualizar
              </Button>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xs text-white/50">{connectionStatus}</span>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="space-y-4">
        <div className="max-w-md mx-auto">
          <ModeloSelect
            ref={modeloSelectRef}
            value={selectedModel}
            onValueChange={setSelectedModel}
          />
        </div>
        
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-3 w-4 h-4 text-white/60" />
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
      ) : products.length === 0 ? (
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-8 text-center">
            <FileText className="w-8 h-8 text-white/60 mx-auto mb-4" />
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
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <tr key={product.id || index} className="border-b border-white/10 hover:bg-white/5">
                      <td className="p-4 text-white font-mono text-sm">
                        {product.codigo}
                      </td>
                      <td className="p-4 text-white">
                        {product.descricao}
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
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
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
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
};

export default ApiProductSearchPanel;