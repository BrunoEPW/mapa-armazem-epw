import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { decodeEPWReference } from '@/utils/epwCodeDecoder';
import { Search, CheckCircle, XCircle, Info } from 'lucide-react';

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

  const handleDecode = () => {
    const result = decodeEPWReference(testCode, true);
    setDecodeResult(result);
    console.log('🔍 EPW Decode Result:', result);
  };

  const testCodes = [
    'csxr32clt01', // 11 chars - example from website
    'RSC23CL01',   // 8 chars - current format
    'RSC23CL',     // 7 chars - short format
    'OSACAN001'    // Special case
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
                {decodeResult.msg}
              </Badge>
            </div>

            {decodeResult.success && decodeResult.decoded && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">Tipo:</span>
                  <div>{decodeResult.decoded.tipo.l} → {decodeResult.decoded.tipo.d}</div>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Certificação:</span>
                  <div>{decodeResult.decoded.certif.l} → {decodeResult.decoded.certif.d}</div>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Modelo:</span>
                  <div>{decodeResult.decoded.modelo.l} → {decodeResult.decoded.modelo.d}</div>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Comprimento:</span>
                  <div>{decodeResult.decoded.comprim.l} → {decodeResult.decoded.comprim.d}</div>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Cor:</span>
                  <div>{decodeResult.decoded.cor.l} → {decodeResult.decoded.cor.d}</div>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Acabamento:</span>
                  <div>{decodeResult.decoded.acabamento.l} → {decodeResult.decoded.acabamento.d}</div>
                </div>
              </div>
            )}

            {!decodeResult.success && (
              <div className="text-red-600 text-sm">
                <Info className="w-4 h-4 inline mr-1" />
                {decodeResult.msg}
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