import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, CheckCircle, XCircle } from 'lucide-react';
import { apiService } from '@/services/apiService';
import { useToast } from '@/hooks/use-toast';

interface ProductCodeVerifierProps {
  show?: boolean;
  onToggle?: () => void;
}

export const ProductCodeVerifier: React.FC<ProductCodeVerifierProps> = ({ 
  show = false, 
  onToggle 
}) => {
  const [codes, setCodes] = useState('RFF23VG01\nRFZ32BG01\nRSA15LL01\nRSD23IW01\nRSD23UR01');
  const [verifying, setVerifying] = useState(false);
  const [results, setResults] = useState<{
    found: { code: string; product: any }[];
    notFound: string[];
    totalSearched: number;
  } | null>(null);
  const { toast } = useToast();

  const handleVerifyCodes = async () => {
    const codeList = codes
      .split('\n')
      .map(code => code.trim())
      .filter(code => code.length > 0);

    if (codeList.length === 0) {
      toast({
        title: "Erro",
        description: "Por favor, insira pelo menos um código",
        variant: "destructive",
      });
      return;
    }

    setVerifying(true);
    setResults(null);

    try {
      const verificationResults = await apiService.verifyProductCodes(codeList);
      setResults(verificationResults);
      
      toast({
        title: "Verificação Concluída",
        description: `Encontrados: ${verificationResults.found.length}, Não encontrados: ${verificationResults.notFound.length}`,
      });
    } catch (error) {
      // Error handled silently
      toast({
        title: "Erro",
        description: "Erro ao verificar códigos na API",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  if (!show) {
    return (
      <Button onClick={onToggle} variant="outline" size="sm">
        <Search className="h-4 w-4 mr-2" />
        Verificar Códigos API
      </Button>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Verificador de Códigos de Produto
            </CardTitle>
            <CardDescription>
              Verifica se códigos de produto existem na API (busca completa)
            </CardDescription>
          </div>
          {onToggle && (
            <Button onClick={onToggle} variant="ghost" size="sm">
              Fechar
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Códigos de Produto (um por linha)
          </label>
          <Textarea
            value={codes}
            onChange={(e) => setCodes(e.target.value)}
            placeholder="Digite os códigos, um por linha&#10;Exemplo:&#10;RFF23VG01&#10;RFZ32BG01"
            className="min-h-[120px]"
          />
        </div>
        
        <Button 
          onClick={handleVerifyCodes} 
          disabled={verifying}
          className="w-full"
        >
          {verifying ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verificando na API...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Verificar Todos os Códigos
            </>
          )}
        </Button>

        {results && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Total de produtos pesquisados: {results.totalSearched.toLocaleString()}</span>
            </div>
            
            {results.found.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 font-medium text-green-600 mb-2">
                  <CheckCircle className="h-4 w-4" />
                  Códigos Encontrados ({results.found.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {results.found.map(({ code, product }) => (
                    <Badge key={code} variant="default" className="bg-green-100 text-green-800">
                      {code}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {results.notFound.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 font-medium text-red-600 mb-2">
                  <XCircle className="h-4 w-4" />
                  Códigos NÃO Encontrados ({results.notFound.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {results.notFound.map((code) => (
                    <Badge key={code} variant="destructive">
                      {code}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div className="text-sm text-muted-foreground pt-2 border-t">
              💡 Esta verificação pesquisou TODOS os produtos disponíveis na API
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};