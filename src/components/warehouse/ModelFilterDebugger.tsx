import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, TestTube, RefreshCw } from 'lucide-react';
import { useApiAttributes } from '@/hooks/useApiAttributes';
import { testFilterCode } from '@/utils/filterCodeMapper';

interface ModelFilterDebuggerProps {
  show?: boolean;
  onToggle?: () => void;
}

export const ModelFilterDebugger: React.FC<ModelFilterDebuggerProps> = ({ 
  show = false, 
  onToggle 
}) => {
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [testResults, setTestResults] = useState<{[key: string]: boolean}>({});
  const [testing, setTesting] = useState(false);
  
  const {
    modelos: apiModelos,
    modelosLoading,
    modelosError,
    refresh: refreshAttributes
  } = useApiAttributes();

  const testSingleModel = async (modelCode: string) => {
    setTesting(true);
    try {
      console.log(`🧪 [ModelDebugger] Testing model code: ${modelCode}`);
      const result = await testFilterCode('modelo', modelCode);
      setTestResults(prev => ({
        ...prev,
        [modelCode]: result
      }));
      console.log(`🧪 [ModelDebugger] Result for ${modelCode}:`, result);
    } catch (error) {
      console.error(`🧪 [ModelDebugger] Error testing ${modelCode}:`, error);
      setTestResults(prev => ({
        ...prev,
        [modelCode]: false
      }));
    }
    setTesting(false);
  };

  const testAllModels = async () => {
    if (!apiModelos?.length) return;
    
    setTesting(true);
    setTestResults({});
    
    console.log(`🧪 [ModelDebugger] Testing all ${apiModelos.length} model codes...`);
    
    for (const modelo of apiModelos.slice(0, 10)) { // Test only first 10 to avoid overwhelming
      try {
        const result = await testFilterCode('modelo', modelo.l);
        setTestResults(prev => ({
          ...prev,
          [modelo.l]: result
        }));
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`🧪 [ModelDebugger] Error testing ${modelo.l}:`, error);
        setTestResults(prev => ({
          ...prev,
          [modelo.l]: false
        }));
      }
    }
    
    setTesting(false);
  };

  if (!show) {
    return (
      <Button
        onClick={onToggle}
        variant="outline"
        size="sm"
        className="text-white border-white hover:bg-white hover:text-black"
      >
        <TestTube className="w-4 h-4 mr-2" />
        Model Filter Debugger
      </Button>
    );
  }

  const workingCodes = Object.entries(testResults).filter(([_, works]) => works);
  const failingCodes = Object.entries(testResults).filter(([_, works]) => !works);

  return (
    <Card className="mb-6 bg-card/20 border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Model Filter Debugger</CardTitle>
          <Button
            onClick={onToggle}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10"
          >
            ✕
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* API Status */}
        <div className="flex items-center gap-2">
          <span className="text-white text-sm">API Modelos:</span>
          {modelosLoading && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
          {modelosError && <Badge variant="destructive">Error</Badge>}
          {apiModelos && <Badge variant="secondary">{apiModelos.length} available</Badge>}
          <Button
            onClick={refreshAttributes}
            variant="outline"
            size="sm"
            className="text-white border-white/20 hover:bg-white/10"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Model Selection for Testing */}
        <div className="space-y-2">
          <label className="text-white text-sm font-medium">Test Individual Model:</label>
          <div className="flex gap-2">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white flex-1">
                <SelectValue placeholder="Select model to test..." />
              </SelectTrigger>
              <SelectContent>
                {apiModelos?.map((modelo) => (
                  <SelectItem key={modelo.l} value={modelo.l}>
                    {modelo.d} ({modelo.l})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => selectedModel && testSingleModel(selectedModel)}
              disabled={!selectedModel || testing}
              variant="outline"
              className="text-white border-white/20 hover:bg-white/10"
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
              Test
            </Button>
          </div>
        </div>

        {/* Batch Testing */}
        <div className="space-y-2">
          <Button
            onClick={testAllModels}
            disabled={!apiModelos?.length || testing}
            variant="outline"
            className="w-full text-white border-white/20 hover:bg-white/10"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Testing Models...
              </>
            ) : (
              <>
                <TestTube className="w-4 h-4 mr-2" />
                Test All Models (First 10)
              </>
            )}
          </Button>
        </div>

        {/* Results Summary */}
        {Object.keys(testResults).length > 0 && (
          <div className="space-y-2">
            <div className="flex gap-4 text-sm">
              <span className="text-green-400">Working: {workingCodes.length}</span>
              <span className="text-red-400">Failing: {failingCodes.length}</span>
            </div>

            {workingCodes.length > 0 && (
              <div>
                <h4 className="text-white text-sm font-medium mb-2">✅ Working Codes:</h4>
                <div className="flex flex-wrap gap-1">
                  {workingCodes.slice(0, 10).map(([code]) => (
                    <Badge key={code} variant="secondary" className="text-xs">
                      {code}
                    </Badge>
                  ))}
                  {workingCodes.length > 10 && (
                    <Badge variant="outline" className="text-xs">
                      +{workingCodes.length - 10} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {failingCodes.length > 0 && (
              <div>
                <h4 className="text-white text-sm font-medium mb-2">❌ Failing Codes:</h4>
                <div className="flex flex-wrap gap-1">
                  {failingCodes.slice(0, 10).map(([code]) => (
                    <Badge key={code} variant="destructive" className="text-xs">
                      {code}
                    </Badge>
                  ))}
                  {failingCodes.length > 10 && (
                    <Badge variant="outline" className="text-xs">
                      +{failingCodes.length - 10} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-400 border-t border-white/10 pt-2">
          <p>💡 Use this tool to test which model codes work with the API filters.</p>
          <p>Working codes should return products, failing codes return empty results.</p>
        </div>
      </CardContent>
    </Card>
  );
};