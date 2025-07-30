import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Settings, Plus, Trash2, Save, AlertTriangle } from 'lucide-react';
import { 
  loadEPWExceptions, 
  addEPWException, 
  removeEPWException,
  EPWException,
  EPWExceptionsData 
} from '@/lib/epwExceptions';
import { decodeEPWReference } from '@/utils/epwCodeDecoder';
import { toast } from 'sonner';

interface EPWExceptionsManagerProps {
  show?: boolean;
  onToggle?: () => void;
}

export const EPWExceptionsManager: React.FC<EPWExceptionsManagerProps> = ({ 
  show = false, 
  onToggle 
}) => {
  const [exceptionsData, setExceptionsData] = useState<EPWExceptionsData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newReason, setNewReason] = useState('');
  const [manualMapping, setManualMapping] = useState({
    tipo: '',
    certif: '',
    modelo: '',
    comprim: '',
    cor: '',
    acabamento: ''
  });

  useEffect(() => {
    loadExceptions();
  }, []);

  const loadExceptions = () => {
    const data = loadEPWExceptions();
    setExceptionsData(data);
  };

  const handleAddException = () => {
    if (!newCode.trim()) {
      toast.error('Código EPW é obrigatório');
      return;
    }

    if (!newReason.trim()) {
      toast.error('Motivo da exceção é obrigatório');
      return;
    }

    // Clean up manual mapping - only include non-empty values
    const cleanMapping = Object.fromEntries(
      Object.entries(manualMapping).filter(([_, value]) => value.trim() !== '')
    );

    addEPWException(
      newCode.trim().toUpperCase(),
      newReason.trim(),
      Object.keys(cleanMapping).length > 0 ? cleanMapping : undefined
    );

    // Reset form
    setNewCode('');
    setNewReason('');
    setManualMapping({
      tipo: '',
      certif: '',
      modelo: '',
      comprim: '',
      cor: '',
      acabamento: ''
    });

    // Reload data
    loadExceptions();

    toast.success(`Exceção criada para código: ${newCode.toUpperCase()}`);
  };

  const handleRemoveException = (code: string) => {
    removeEPWException(code);
    loadExceptions();
    toast.success(`Exceção removida: ${code}`);
  };

  const testCode = (code: string) => {
    const result = decodeEPWReference(code, true);
    console.log(`🧪 [EPW Test] Testing code: ${code}`, result);
    
    if (result.success) {
      toast.success(`Código ${code} decodificado com sucesso`);
    } else {
      toast.error(`Falha ao decodificar ${code}: ${result.message}`);
    }
  };

  if (!show) {
    return (
      <Button 
        onClick={onToggle}
        variant="outline" 
        size="sm"
        className="gap-2"
      >
        <Settings className="w-4 h-4" />
        Exceções EPW
      </Button>
    );
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-orange-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Gestão de Exceções EPW
          </CardTitle>
          <Button onClick={onToggle} variant="ghost" size="sm">
            ✕
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Exceptions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-orange-800">
              Exceções Ativas ({exceptionsData?.exceptions.length || 0})
            </h4>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nova Exceção
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Nova Exceção EPW</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Código EPW</label>
                      <Input
                        value={newCode}
                        onChange={(e) => setNewCode(e.target.value)}
                        placeholder="Ex: mlsfmlvl01"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Motivo</label>
                      <Input
                        value={newReason}
                        onChange={(e) => setNewReason(e.target.value)}
                        placeholder="Ex: Código não padrão"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Mapeamento Manual (opcional)</label>
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      <Input
                        placeholder="Tipo"
                        value={manualMapping.tipo}
                        onChange={(e) => setManualMapping(prev => ({ ...prev, tipo: e.target.value }))}
                      />
                      <Input
                        placeholder="Certificação"
                        value={manualMapping.certif}
                        onChange={(e) => setManualMapping(prev => ({ ...prev, certif: e.target.value }))}
                      />
                      <Input
                        placeholder="Modelo"
                        value={manualMapping.modelo}
                        onChange={(e) => setManualMapping(prev => ({ ...prev, modelo: e.target.value }))}
                      />
                      <Input
                        placeholder="Comprimento"
                        value={manualMapping.comprim}
                        onChange={(e) => setManualMapping(prev => ({ ...prev, comprim: e.target.value }))}
                      />
                      <Input
                        placeholder="Cor"
                        value={manualMapping.cor}
                        onChange={(e) => setManualMapping(prev => ({ ...prev, cor: e.target.value }))}
                      />
                      <Input
                        placeholder="Acabamento"
                        value={manualMapping.acabamento}
                        onChange={(e) => setManualMapping(prev => ({ ...prev, acabamento: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddException} className="gap-2">
                      <Save className="w-4 h-4" />
                      Gravar Exceção
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Exceptions List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {exceptionsData?.exceptions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Nenhuma exceção registada
              </div>
            ) : (
              exceptionsData?.exceptions.map((exception) => (
                <div 
                  key={exception.code}
                  className="flex items-center justify-between p-3 bg-white rounded border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        {exception.code}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {exception.reason}
                      </span>
                    </div>
                    
                    {exception.manualMapping && (
                      <div className="mt-1 text-xs text-blue-600">
                        Mapeamento: {Object.entries(exception.manualMapping)
                          .filter(([_, value]) => value)
                          .map(([key, value]) => `${key}=${value}`)
                          .join(', ')}
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground mt-1">
                      Criado: {new Date(exception.createdAt).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testCode(exception.code)}
                    >
                      Testar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveException(exception.code)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="text-xs text-orange-700 bg-orange-100 p-2 rounded">
          💾 <strong>Importante:</strong> As exceções são guardadas permanentemente no localStorage 
          e NÃO são apagadas quando o código é alterado.
        </div>
      </CardContent>
    </Card>
  );
};