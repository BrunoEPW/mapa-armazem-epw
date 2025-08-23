import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Bug, Database, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SearchDebugConsoleProps {
  hookData: {
    products: any[];
    loading: boolean;
    error: string | null;
    currentPage: number;
    totalPages: number;
    totalCount: number;
    isConnected: boolean;
    connectionStatus: string;
    searchQuery: string;
  };
  selectedModel: string;
  selectedComprimento?: string;
  selectedCor?: string;
  additionalInfo?: Record<string, any>;
}

export const SearchDebugConsole: React.FC<SearchDebugConsoleProps> = ({ 
  hookData, 
  selectedModel,
  selectedComprimento = 'all',
  selectedCor = 'all',
  additionalInfo = {} 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const debugInfo = {
    timestamp: new Date().toISOString(),
    selectedModel,
    selectedComprimento,
    selectedCor,
    searchQuery: hookData.searchQuery,
    products: {
      count: hookData.products.length,
      sample: hookData.products.slice(0, 3).map(p => ({
        id: p.id,
        codigo: p.codigo,
        descricao: p.descricao?.substring(0, 50) + '...'
      }))
    },
    pagination: {
      currentPage: hookData.currentPage,
      totalPages: hookData.totalPages,
      totalCount: hookData.totalCount,
      itemsPerPage: 20
    },
    states: {
      loading: hookData.loading,
      error: hookData.error,
      isConnected: hookData.isConnected,
      connectionStatus: hookData.connectionStatus
    },
    filters: {
      hasModelFilter: selectedModel !== 'all',
      hasSearchQuery: !!hookData.searchQuery.trim(),
      appliedFilters: {
        model: selectedModel !== 'all' ? selectedModel : null,
        search: hookData.searchQuery.trim() || null
      }
    },
    issues: {
      noProducts: hookData.products.length === 0 && !hookData.loading,
      hasError: !!hookData.error,
      disconnected: !hookData.isConnected,
      emptySearch: !hookData.searchQuery.trim() && selectedModel === 'all' && selectedComprimento === 'all' && selectedCor === 'all'
    },
    ...additionalInfo
  };

  const issueCount = Object.values(debugInfo.issues).filter(Boolean).length;

  return (
    <Card className="mt-6 border-yellow-500/20 bg-yellow-500/5">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-yellow-500/10 transition-colors p-4">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Bug className="w-4 h-4 text-yellow-500" />
                <span className="text-yellow-500">Console de Debug - Pesquisa</span>
                {issueCount > 0 && (
                  <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs">
                    {issueCount} {issueCount === 1 ? 'issue' : 'issues'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {hookData.products.length} produtos | p.{hookData.currentPage}/{hookData.totalPages}
                </span>
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Current State */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium text-yellow-500 flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  Estado Atual
                </h4>
                <div className="space-y-1 text-xs">
                  <div>Estado: {hookData.loading ? '🔄 Carregando' : '✅ Pronto'}</div>
                  <div>Conexão: {hookData.isConnected ? '🟢 Online' : '🔴 Offline'}</div>
                    <div>Modelo: {selectedModel === 'all' ? 'Todos' : selectedModel}</div>
                    <div>Comprimento: {selectedComprimento === 'all' ? 'Todos' : selectedComprimento}</div>
                    <div>Cor: {selectedCor === 'all' ? 'Todas' : selectedCor}</div>
                    <div>Pesquisa: {hookData.searchQuery || 'Vazia'}</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-blue-400 flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  Issues Detectados
                </h4>
                <div className="space-y-1 text-xs">
                  {debugInfo.issues.hasError && (
                    <div className="text-red-400">❌ Erro na API</div>
                  )}
                  {debugInfo.issues.noProducts && (
                    <div className="text-yellow-400">⚠️ Sem produtos</div>
                  )}
                  {debugInfo.issues.disconnected && (
                    <div className="text-red-400">🔌 Desconectado</div>
                  )}
                  {debugInfo.issues.emptySearch && (
                    <div className="text-blue-400">ℹ️ Pesquisa vazia</div>
                  )}
                  {issueCount === 0 && (
                    <div className="text-green-400">✅ Sem issues</div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-green-400">Análise Paginação</h4>
                <div className="space-y-1 text-xs">
                  <div>Página: {hookData.currentPage}/{hookData.totalPages}</div>
                  <div>Total: {hookData.totalCount} produtos</div>
                  <div>Items/página: 20</div>
                  <div>Produtos carregados: {hookData.products.length}</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-purple-400">Status da API</h4>
                <div className="space-y-1 text-xs">
                  <div>Status: {hookData.connectionStatus}</div>
                  <div>Erro: {hookData.error || 'Nenhum'}</div>
                  <div className={`w-2 h-2 rounded-full inline-block mr-2 ${hookData.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>{hookData.isConnected ? 'Conectado' : 'Desconectado'}</span>
                </div>
              </div>
            </div>

            {/* Sample Products */}
            {debugInfo.products.sample.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-cyan-400">Produtos de Exemplo</h4>
                <div className="grid gap-2 text-xs">
                  {debugInfo.products.sample.map((product, index) => (
                    <div key={index} className="bg-black/20 p-2 rounded font-mono">
                      {product.codigo} - {product.descricao}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw Debug Data */}
            <div className="space-y-2">
              <h4 className="font-medium text-orange-400">Dados de Debug Raw</h4>
              <div className="bg-black/20 p-3 rounded text-xs font-mono overflow-x-auto">
                <pre className="whitespace-pre-wrap text-white/80">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};