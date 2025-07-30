import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { decodeEPWReference } from '@/utils/epwCodeDecoder';
import { attributesApiService } from '@/services/attributesApiService';
import { Search, CheckCircle, XCircle, Info, Loader2, Globe } from 'lucide-react';

interface EPWCodeDebuggerProps {
  show?: boolean;
  onToggle?: () => void;
}

export const EPWCodeDebugger: React.FC<EPWCodeDebuggerProps> = ({ 
  show = false, 
  onToggle 
}) => {
  const [testCode, setTestCode] = useState('csxr32clt01');
  const [decodeResult, setDecodeResult] = useState<any>(null);
  const [apiAttributes, setApiAttributes] = useState<any>({});
  const [loadingApi, setLoadingApi] = useState(false);

  const handleDecode = () => {
    const result = decodeEPWReference(testCode, true);
    setDecodeResult(result);
    console.log('🔍 EPW Decode Result:', result);
  };

  const fetchApiAttributes = async () => {
    setLoadingApi(true);
    try {
      const [tipos, modelos, cores, acabamentos, comprimentos] = await Promise.all([
        attributesApiService.fetchTipos(),
        attributesApiService.fetchModelos(),
        attributesApiService.fetchCores(),
        attributesApiService.fetchAcabamentos(),
        attributesApiService.fetchComprimentos()
      ]);
      
      setApiAttributes({
        tipos,
        modelos,
        cores,
        acabamentos,
        comprimentos
      });
      
      console.log('🌐 API Attributes fetched:', { tipos, modelos, cores, acabamentos, comprimentos });
    } catch (error) {
      console.error('❌ Failed to fetch API attributes:', error);
    } finally {
      setLoadingApi(false);
    }
  };

  useEffect(() => {
    if (show && Object.keys(apiAttributes).length === 0) {
      fetchApiAttributes();
    }
  }, [show]);

  const testCodes = [
    'csxr32clt01', // 11 chars - example from website
    'RSC23CL01',   // 8 chars - current format
    'RSC23CL',     // 7 chars - short format
    'OSACAN001',   // Special case
    'CSR23CL01',   // Test variation
    'TSR30CI02'    // Another test variation
  ];

  if (!show) {
    return (
      <Button
        onClick={onToggle}
        variant="outline"
        size="sm"
        className="text-white border-white hover:bg-white hover:text-black"
      >
        <Search className="w-4 h-4 mr-2" />
        Debug EPW Codes
      </Button>
    );
  }

  return (
    <Card className="bg-card/95 backdrop-blur">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">EPW Code Debugger</CardTitle>
          <Button
            onClick={onToggle}
            variant="outline"
            size="sm"
          >
            Fechar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* API Attributes Status */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Status da API:</span>
          <div className="flex items-center gap-2">
            {loadingApi ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</>
            ) : Object.keys(apiAttributes).length > 0 ? (
              <><CheckCircle className="w-4 h-4 text-green-500" /> Conectado</>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-red-500" /> 
                Desconectado
                <Button onClick={fetchApiAttributes} size="sm" variant="outline">
                  <Globe className="w-4 h-4 mr-1" />
                  Conectar
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Manual Test Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Testar Código EPW:</label>
          <div className="flex gap-2">
            <Input
              value={testCode}
              onChange={(e) => setTestCode(e.target.value)}
              placeholder="Digite um código EPW"
              className="flex-1"
            />
            <Button onClick={handleDecode} size="sm">
              <Search className="w-4 h-4 mr-1" />
              Decode
            </Button>
          </div>
        </div>

        {/* Quick Test Buttons */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Códigos de Teste:</label>
          <div className="flex flex-wrap gap-2">
            {testCodes.map((code) => (
              <Button
                key={code}
                onClick={() => {
                  setTestCode(code);
                  const result = decodeEPWReference(code, true);
                  setDecodeResult(result);
                }}
                variant="outline"
                size="sm"
              >
                {code}
              </Button>
            ))}
          </div>
        </div>

        {/* Decode Result */}
        {decodeResult && (
          <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              {decodeResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <span className="font-medium">
                {decodeResult.success ? 'Decodificação Bem-sucedida' : 'Erro na Decodificação'}
              </span>
              <Badge variant={decodeResult.success ? 'default' : 'destructive'}>
                {decodeResult.message}
              </Badge>
            </div>

            {decodeResult.success && decodeResult.product && (
              <div className="space-y-4">
                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border">
                  🔧 <strong>Parsing Adaptativo:</strong> Código analisado de trás para frente usando estrutura variável
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Tipo:</span>
                    <div>{decodeResult.product.tipo.l} → {decodeResult.product.tipo.d}</div>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Certificação:</span>
                    <div>{decodeResult.product.certif.l} → {decodeResult.product.certif.d}</div>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Modelo:</span>
                    <div>{decodeResult.product.modelo.l} → {decodeResult.product.modelo.d}</div>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Comprimento:</span>
                    <div>{decodeResult.product.comprim.l} → {decodeResult.product.comprim.d}</div>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Cor:</span>
                    <div>{decodeResult.product.cor.l} → {decodeResult.product.cor.d}</div>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Acabamento:</span>
                    <div>{decodeResult.product.acabamento.l} → {decodeResult.product.acabamento.d}</div>
                  </div>
                </div>

                {/* API Comparison */}
                {Object.keys(apiAttributes).length > 0 && (
                  <div className="border-t pt-3">
                    <div className="text-sm font-medium mb-2">Comparação com API:</div>
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      {['tipos', 'modelos', 'cores', 'acabamentos', 'comprimentos'].map((attr) => {
                        const apiData = apiAttributes[attr] || [];
                        const decodedValue = getDecodedAttributeCode(decodeResult.product, attr);
                        const found = apiData.find((item: any) => item.l === decodedValue);
                        return (
                          <div key={attr} className="flex items-center gap-2">
                            <span className="capitalize min-w-[80px]">{attr.slice(0, -1)}:</span>
                            {found ? (
                              <Badge variant="default" className="text-xs">✓ {found.l} = {found.d}</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">? {decodedValue} (não encontrado)</Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!decodeResult.success && (
              <div className="text-red-600 text-sm">
                <Info className="w-4 h-4 inline mr-1" />
                {decodeResult.message}
              </div>
            )}
          </div>
        )}

        {/* Pattern Information */}
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="font-medium">Padrões Suportados:</div>
          <div>• 7 chars: AAANNAA (ex: RSC23CL)</div>
          <div>• 8 chars: AAANNAA# (ex: RSC23CL01)</div>
          <div>• 11 chars: AAANNAAAANN (ex: csxr32clt01)</div>
          <div className="mt-2">
            <span className="font-medium">Legenda:</span> A=Atributo, N=Número, #=Variante
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to get the decoded attribute code for comparison
const getDecodedAttributeCode = (decoded: any, attribute: string): string => {
  switch (attribute) {
    case 'tipos': return decoded.tipo.l;
    case 'modelos': return decoded.modelo.l;
    case 'cores': return decoded.cor.l;
    case 'acabamentos': return decoded.acabamento.l;
    case 'comprimentos': return decoded.comprim.l;
    default: return '';
  }
};