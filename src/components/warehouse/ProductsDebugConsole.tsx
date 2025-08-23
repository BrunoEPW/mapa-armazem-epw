import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Bug } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ProductsDebugConsoleProps {
  hookData: {
    products: any[];
    loading: boolean;
    error: string | null;
    currentPage: number;
    totalPages: number;
    totalCount: number;
    itemsPerPage: number;
    isConnected: boolean;
    connectionStatus: string;
    searchQuery: string;
  };
  selectedModel: string;
  selectedComprimento?: string;
  selectedCor?: string;
  additionalInfo?: any;
}

export const ProductsDebugConsole: React.FC<ProductsDebugConsoleProps> = ({
  hookData,
  selectedModel,
  selectedComprimento,
  selectedCor,
  additionalInfo
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const debugInfo = {
    timestamp: new Date().toISOString(),
    hookState: {
      productsCount: hookData.products.length,
      loading: hookData.loading,
      error: hookData.error,
      currentPage: hookData.currentPage,
      totalPages: hookData.totalPages,
      totalCount: hookData.totalCount,
      itemsPerPage: hookData.itemsPerPage,
      isConnected: hookData.isConnected,
      connectionStatus: hookData.connectionStatus,
      searchQuery: hookData.searchQuery,
    },
    filters: {
      selectedModel,
      selectedComprimento: selectedComprimento || 'all',
      selectedCor: selectedCor || 'all',
      modelFilter: selectedModel !== 'all' ? selectedModel : 'undefined',
      comprimentoFilter: selectedComprimento && selectedComprimento !== 'all' ? selectedComprimento : 'undefined',
      corFilter: selectedCor && selectedCor !== 'all' ? selectedCor : 'undefined',
      searchActive: !!hookData.searchQuery,
    },
    pagination: {
      currentPage: hookData.currentPage,
      totalPages: hookData.totalPages,
      totalCount: hookData.totalCount,
      expectedStart: (hookData.currentPage - 1) * hookData.itemsPerPage,
      itemsPerPage: hookData.itemsPerPage,
    },
    products: hookData.products.slice(0, 3).map(p => ({
      id: p.id,
      codigo: p.codigo,
      descricao: p.descricao?.substring(0, 50) + '...'
    })),
    issues: {
      noProducts: hookData.products.length === 0 && !hookData.loading,
      paginationMismatch: hookData.totalCount > 0 && hookData.products.length === 0 && hookData.currentPage > 1,
      errorState: !!hookData.error,
      loadingTooLong: hookData.loading,
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-black/80 text-white border-white/20 hover:bg-black/90"
          >
            <Bug className="w-4 h-4" />
            Debug Console
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <Card className="mt-2 bg-black/90 text-white border-white/20 max-h-96 overflow-y-auto">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bug className="w-4 h-4" />
                Products Debug Info
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-3">
              
              {/* Current State */}
              <div>
                <h4 className="font-semibold text-yellow-400 mb-1">Current State</h4>
                <div className="bg-gray-800/50 p-2 rounded text-xs font-mono">
                  <div>Loading: <span className={hookData.loading ? 'text-yellow-400' : 'text-green-400'}>{hookData.loading.toString()}</span></div>
                  <div>Products: <span className="text-blue-400">{hookData.products.length}</span></div>
                  <div>Total Count: <span className="text-blue-400">{hookData.totalCount}</span></div>
                  <div>Page: <span className="text-blue-400">{hookData.currentPage}/{hookData.totalPages}</span></div>
                   <div>Model Filter: <span className="text-purple-400">{selectedModel}</span></div>
                   <div>Comprimento Filter: <span className="text-purple-400">{selectedComprimento || 'all'}</span></div>
                   <div>Cor Filter: <span className="text-purple-400">{selectedCor || 'all'}</span></div>
                   <div>Search: <span className="text-purple-400">"{hookData.searchQuery}"</span></div>
                </div>
              </div>

              {/* Issues Detection */}
              <div>
                <h4 className="font-semibold text-red-400 mb-1">Issues Detected</h4>
                <div className="space-y-1">
                  {Object.entries(debugInfo.issues).map(([key, value]) => (
                    <div key={key} className={`text-xs ${value ? 'text-red-400' : 'text-green-400'}`}>
                      {key}: {value.toString()}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination Analysis */}
              <div>
                <h4 className="font-semibold text-blue-400 mb-1">Pagination Analysis</h4>
                <div className="bg-gray-800/50 p-2 rounded text-xs font-mono">
                  <div>Expected Start: <span className="text-yellow-400">{debugInfo.pagination.expectedStart}</span></div>
                  <div>Items Per Page: <span className="text-yellow-400">{debugInfo.pagination.itemsPerPage}</span></div>
                  <div>Total Available: <span className="text-yellow-400">{hookData.totalCount}</span></div>
                  <div>Current Results: <span className="text-yellow-400">{hookData.products.length}</span></div>
                </div>
              </div>

              {/* API Status */}
              <div>
                <h4 className="font-semibold text-green-400 mb-1">API Status</h4>
                <div className="bg-gray-800/50 p-2 rounded text-xs">
                  <div>Connected: <span className={hookData.isConnected ? 'text-green-400' : 'text-red-400'}>{hookData.isConnected.toString()}</span></div>
                  <div>Status: <span className="text-gray-300">{hookData.connectionStatus}</span></div>
                  {hookData.error && <div>Error: <span className="text-red-400">{hookData.error}</span></div>}
                </div>
              </div>

              {/* Sample Products */}
              {debugInfo.products.length > 0 && (
                <div>
                  <h4 className="font-semibold text-purple-400 mb-1">Sample Products ({debugInfo.products.length}/3)</h4>
                  <div className="space-y-1">
                    {debugInfo.products.map((product, index) => (
                      <div key={index} className="text-xs bg-gray-800/50 p-1 rounded">
                        <div><span className="text-yellow-400">{product.codigo}</span></div>
                        <div className="text-gray-400">{product.descricao}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw Debug Data */}
              <details className="text-xs">
                <summary className="cursor-pointer text-gray-400 hover:text-white">Raw Debug Data</summary>
                <pre className="mt-2 bg-gray-900 p-2 rounded overflow-x-auto text-xs">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>

            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};