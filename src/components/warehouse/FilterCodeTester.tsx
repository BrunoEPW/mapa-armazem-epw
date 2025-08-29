import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFilterTester } from '@/hooks/useFilterTester';
import { useApiAttributes } from '@/hooks/useApiAttributes';
import { Loader2, TestTube, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface FilterCodeTesterProps {
  show?: boolean;
  onToggle?: () => void;
}

export const FilterCodeTester: React.FC<FilterCodeTesterProps> = ({ 
  show = false, 
  onToggle 
}) => {
  const { testing, results, testAllCodes, clearResults } = useFilterTester();
  const { 
    modelos, acabamentos, cores, comprimentos,
    modelosLoading, acabamentosLoading, coresLoading, comprimentosLoading,
    refresh
  } = useApiAttributes();

  const [selectedFilterType, setSelectedFilterType] = useState<string>('modelo');

  const handleTestFilter = async (filterType: string) => {
    const attributeMap: any = {
      modelo: modelos,
      acabamento: acabamentos,
      cor: cores,
      comprimento: comprimentos
    };

    const attributes = attributeMap[filterType] || [];
    if (attributes.length === 0) {
      return;
    }

    await testAllCodes(filterType, attributes);
  };

  const filterTypes = [
    { key: 'modelo', label: 'Modelo', data: modelos, loading: modelosLoading },
    { key: 'acabamento', label: 'Acabamento', data: acabamentos, loading: acabamentosLoading },
    { key: 'cor', label: 'Cor', data: cores, loading: coresLoading },
    { key: 'comprimento', label: 'Comprimento', data: comprimentos, loading: comprimentosLoading }
  ];

  const workingResults = results.filter(r => r.isWorking);
  const failedResults = results.filter(r => !r.isWorking);

  if (!show) {
    return (
      <Button
        onClick={onToggle}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <TestTube className="w-4 h-4" />
        Filter Tester
      </Button>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">🧪 Testador de Filtros da API</CardTitle>
          <Button onClick={onToggle} variant="ghost" size="sm">✕</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* API Status */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Status dos Atributos:</span>
          <Button onClick={refresh} size="sm" variant="outline" disabled={testing}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Atualizar
          </Button>
        </div>

        {/* Filter Type Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Selecionar Tipo de Filtro:</label>
          <div className="grid grid-cols-3 gap-2">
            {filterTypes.map(({ key, label, data, loading }) => (
              <Button
                key={key}
                onClick={() => setSelectedFilterType(key)}
                variant={selectedFilterType === key ? "default" : "outline"}
                size="sm"
                disabled={testing || loading}
                className="text-xs"
              >
                {loading ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <span className="mr-1">{data.length}</span>
                )}
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Test Actions */}
        <div className="flex gap-2">
          <Button
            onClick={() => handleTestFilter(selectedFilterType)}
            disabled={testing}
            size="sm"
            className="flex-1"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testando...
              </>
            ) : (
              <>
                <TestTube className="w-4 h-4 mr-2" />
                Testar {selectedFilterType}
              </>
            )}
          </Button>
          <Button
            onClick={clearResults}
            variant="outline"
            size="sm"
            disabled={testing}
          >
            Limpar
          </Button>
        </div>

        {/* Results Summary */}
        {results.length > 0 && (
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>{workingResults.length} funcionam</span>
            </div>
            <div className="flex items-center gap-1">
              <XCircle className="w-4 h-4 text-red-500" />
              <span>{failedResults.length} falham</span>
            </div>
          </div>
        )}

        {/* Working Results */}
        {workingResults.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-green-600">✅ Códigos que Funcionam:</div>
            <div className="grid grid-cols-2 gap-2">
              {workingResults.slice(0, 8).map((result, idx) => (
                <Badge key={idx} variant="default" className="text-xs justify-start">
                  {result.code} = {result.description.slice(0, 20)}
                  {result.description.length > 20 ? '...' : ''}
                </Badge>
              ))}
            </div>
            {workingResults.length > 8 && (
              <div className="text-xs text-muted-foreground">
                +{workingResults.length - 8} mais...
              </div>
            )}
          </div>
        )}

        {/* Failed Results */}
        {failedResults.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-red-600">❌ Códigos que Falham:</div>
            <div className="grid grid-cols-2 gap-2">
              {failedResults.slice(0, 4).map((result, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs justify-start">
                  {result.code} = {result.description.slice(0, 15)}
                  {result.description.length > 15 ? '...' : ''}
                </Badge>
              ))}
            </div>
            {failedResults.length > 4 && (
              <div className="text-xs text-muted-foreground">
                +{failedResults.length - 4} mais...
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-muted-foreground p-3 bg-muted rounded">
          <div className="font-medium mb-1">Como usar:</div>
          <div>1. Selecione o tipo de filtro que quer testar</div>
          <div>2. Clique em "Testar" para verificar quais códigos funcionam na API</div>
          <div>3. Os códigos verdes retornam resultados, os vermelhos não</div>
        </div>
      </CardContent>
    </Card>
  );
};