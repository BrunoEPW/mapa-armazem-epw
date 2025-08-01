import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  decodeEPWReference, 
  decodeEPWReferenceWithValidation, 
  testEPWCodes, 
  preloadApiAttributes,
  clearEPWCache,
  type EPWDecodeResult 
} from '@/utils/epwCodeDecoder';
import { toast } from 'sonner';

interface EPWDecoderTesterProps {
  show?: boolean;
  onToggle?: () => void;
}

export const EPWDecoderTester: React.FC<EPWDecoderTesterProps> = ({ 
  show = false, 
  onToggle 
}) => {
  const [testCode, setTestCode] = useState('RFL23AL01');
  const [decodeResult, setDecodeResult] = useState<EPWDecodeResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [debug, setDebug] = useState(true);

  const handleDecodeStandard = () => {
    setIsLoading(true);
    try {
      const result = decodeEPWReference(testCode, debug);
      setDecodeResult(result);
      
      if (result.success) {
        toast.success(`Código ${testCode} descodificado com sucesso!`);
      } else {
        toast.error(`Falha na descodificação: ${result.message}`);
      }
    } catch (error) {
      toast.error(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecodeWithValidation = async () => {
    setIsLoading(true);
    try {
      const result = await decodeEPWReferenceWithValidation(testCode, debug);
      setDecodeResult(result);
      
      if (result.success) {
        toast.success(`Código ${testCode} descodificado e validado com APIs!`);
      } else {
        toast.error(`Falha na descodificação: ${result.message}`);
      }
    } catch (error) {
      toast.error(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestSpecificCodes = async () => {
    setIsLoading(true);
    try {
      await testEPWCodes(debug);
      toast.success('Teste dos códigos específicos concluído! Veja a consola para detalhes.');
    } catch (error) {
      toast.error(`Erro no teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreloadApis = async () => {
    setIsLoading(true);
    try {
      await preloadApiAttributes();
      toast.success('APIs de atributos pré-carregadas com sucesso!');
    } catch (error) {
      toast.error(`Erro no pré-carregamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCache = () => {
    clearEPWCache();
    toast.success('Cache do descodificador limpo!');
  };

  if (!show) {
    return (
      <Button variant="outline" onClick={onToggle}>
        🧪 Testar Descodificador EPW
      </Button>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>🧪 Testador do Descodificador EPW</CardTitle>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            ✕
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Input para código de teste */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Código para testar:</label>
          <Input
            value={testCode}
            onChange={(e) => setTestCode(e.target.value.toUpperCase())}
            placeholder="Ex: RFL23AL01"
            className="font-mono"
          />
        </div>

        {/* Controlos de teste */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={handleDecodeStandard} 
            disabled={isLoading || !testCode}
            variant="outline"
          >
            Descodificar Standard
          </Button>
          
          <Button 
            onClick={handleDecodeWithValidation} 
            disabled={isLoading || !testCode}
            variant="default"
          >
            Descodificar + API
          </Button>
        </div>

        {/* Controlos de sistema */}
        <Separator />
        
        <div className="grid grid-cols-3 gap-2">
          <Button 
            onClick={handleTestSpecificCodes} 
            disabled={isLoading}
            variant="secondary"
            size="sm"
          >
            Testar Códigos Específicos
          </Button>
          
          <Button 
            onClick={handlePreloadApis} 
            disabled={isLoading}
            variant="secondary"
            size="sm"
          >
            Pré-carregar APIs
          </Button>
          
          <Button 
            onClick={handleClearCache} 
            disabled={isLoading}
            variant="destructive"
            size="sm"
          >
            Limpar Cache
          </Button>
        </div>

        {/* Toggle debug */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="debug"
            checked={debug}
            onChange={(e) => setDebug(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="debug" className="text-sm">Modo debug (logs detalhados)</label>
        </div>

        {/* Resultados */}
        {decodeResult && (
          <>
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Badge variant={decodeResult.success ? "default" : "destructive"}>
                  {decodeResult.success ? "✅ Sucesso" : "❌ Falha"}
                </Badge>
                <span className="text-sm text-muted-foreground">{decodeResult.message}</span>
              </div>

              {decodeResult.success && decodeResult.product && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <strong>Tipo:</strong> {decodeResult.product.tipo.l} ({decodeResult.product.tipo.d})
                  </div>
                  <div>
                    <strong>Certificação:</strong> {decodeResult.product.certif.l} ({decodeResult.product.certif.d})
                  </div>
                  <div>
                    <strong>Modelo:</strong> {decodeResult.product.modelo.l} ({decodeResult.product.modelo.d})
                  </div>
                  <div>
                    <strong>Comprimento:</strong> {decodeResult.product.comprim.l} ({decodeResult.product.comprim.d})
                  </div>
                  <div>
                    <strong>Cor:</strong> {decodeResult.product.cor.l} ({decodeResult.product.cor.d})
                  </div>
                  <div>
                    <strong>Acabamento:</strong> {decodeResult.product.acabamento.l} ({decodeResult.product.acabamento.d})
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Instruções */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Estrutura esperada:</strong> [TIPO(1-2)][CERTIFICAÇÃO(1)][MODELO(1-2)][COMPRIMENTO(2)][COR(1)][ACABAMENTO(1)][FINAL(2-ignorar)]</p>
          <p><strong>Códigos de teste:</strong> RFL23AL01, RSZ32AG01, RSEZ23VL01</p>
          <p><strong>Certificações:</strong> S (Sem), F (FSC)</p>
        </div>
      </CardContent>
    </Card>
  );
};