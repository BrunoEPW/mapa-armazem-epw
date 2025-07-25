// Filter Debug Panel - Shows detailed information about filter codes
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFilterTester } from '@/hooks/useFilterTester';
import { ApiAttribute } from '@/services/attributesApiService';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface FilterDebugPanelProps {
  show: boolean;
  onToggle: () => void;
  apiCores: ApiAttribute[];
  apiTipos: ApiAttribute[];
  apiAcabamentos: ApiAttribute[];
  apiComprimentos: ApiAttribute[];
}

export const FilterDebugPanel: React.FC<FilterDebugPanelProps> = ({
  show,
  onToggle,
  apiCores,
  apiTipos,
  apiAcabamentos,
  apiComprimentos
}) => {
  const { testing, results, testAllCodes, clearResults } = useFilterTester();

  if (!show) {
    return (
      <Button 
        onClick={onToggle}
        variant="outline" 
        size="sm"
        className="text-white border-white hover:bg-white hover:text-black"
      >
        🔍 Debug Filtros
      </Button>
    );
  }

  return (
    <Card className="bg-card/20 border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Debug de Filtros EPW</CardTitle>
            <CardDescription className="text-gray-300">
              Teste dos códigos de filtro da API
            </CardDescription>
          </div>
          <Button 
            onClick={onToggle}
            variant="outline" 
            size="sm"
            className="text-white border-white hover:bg-white hover:text-black"
          >
            Fechar
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Test Controls */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => testAllCodes('Cor', apiCores)}
            disabled={testing}
            size="sm"
            variant="outline"
            className="text-white border-white hover:bg-white hover:text-black"
          >
            {testing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
            Testar Cores ({apiCores.length})
          </Button>
          
          <Button
            onClick={() => testAllCodes('Tipo', apiTipos)}
            disabled={testing}
            size="sm"
            variant="outline"
            className="text-white border-white hover:bg-white hover:text-black"
          >
            Testar Tipos ({apiTipos.length})
          </Button>
          
          <Button
            onClick={() => testAllCodes('Acabamento', apiAcabamentos)}
            disabled={testing}
            size="sm"
            variant="outline"
            className="text-white border-white hover:bg-white hover:text-black"
          >
            Testar Acabamentos ({apiAcabamentos.length})
          </Button>
          
          <Button
            onClick={() => testAllCodes('Comprimento', apiComprimentos)}
            disabled={testing}
            size="sm"
            variant="outline"
            className="text-white border-white hover:bg-white hover:text-black"
          >
            Testar Comprimentos ({apiComprimentos.length})
          </Button>
          
          <Button
            onClick={clearResults}
            disabled={testing}
            size="sm"
            variant="destructive"
          >
            Limpar Resultados
          </Button>
        </div>

        {/* API Data Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <h4 className="text-white font-medium mb-2">Cores da API ({apiCores.length})</h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {apiCores.slice(0, 5).map(cor => (
                <Badge key={cor.l} variant="outline" className="text-xs">
                  {cor.l}: {cor.d}
                </Badge>
              ))}
              {apiCores.length > 5 && (
                <Badge variant="secondary" className="text-xs">
                  +{apiCores.length - 5} mais...
                </Badge>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-2">Tipos da API ({apiTipos.length})</h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {apiTipos.slice(0, 5).map(tipo => (
                <Badge key={tipo.l} variant="outline" className="text-xs">
                  {tipo.l}: {tipo.d}
                </Badge>
              ))}
              {apiTipos.length > 5 && (
                <Badge variant="secondary" className="text-xs">
                  +{apiTipos.length - 5} mais...
                </Badge>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-2">Acabamentos da API ({apiAcabamentos.length})</h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {apiAcabamentos.slice(0, 5).map(acabamento => (
                <Badge key={acabamento.l} variant="outline" className="text-xs">
                  {acabamento.l}: {acabamento.d}
                </Badge>
              ))}
              {apiAcabamentos.length > 5 && (
                <Badge variant="secondary" className="text-xs">
                  +{apiAcabamentos.length - 5} mais...
                </Badge>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-2">Comprimentos da API ({apiComprimentos.length})</h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {apiComprimentos.slice(0, 5).map(comprimento => (
                <Badge key={comprimento.l} variant="outline" className="text-xs">
                  {comprimento.l}: {comprimento.d}
                </Badge>
              ))}
              {apiComprimentos.length > 5 && (
                <Badge variant="secondary" className="text-xs">
                  +{apiComprimentos.length - 5} mais...
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Test Results */}
        {results.length > 0 && (
          <div>
            <h4 className="text-white font-medium mb-2">
              Resultados dos Testes ({results.filter(r => r.isWorking).length}/{results.length} funcionam)
            </h4>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {results.map((result, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-2 bg-card/10 rounded border border-border"
                >
                  <div className="flex items-center gap-2">
                    {result.isWorking ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-white text-sm">
                      {result.filterType}={result.code}
                    </span>
                    <span className="text-gray-300 text-sm">
                      ({result.description})
                    </span>
                  </div>
                  <Badge 
                    variant={result.isWorking ? "default" : "destructive"} 
                    className="text-xs"
                  >
                    {result.isWorking ? "✓ Funciona" : "✗ Falha"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};