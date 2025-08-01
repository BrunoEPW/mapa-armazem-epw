import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Settings, Plus, Trash2, Save, AlertTriangle, Download, Upload, Shield, CheckCircle } from 'lucide-react';
import { 
  loadEPWExceptions, 
  addEPWException, 
  removeEPWException,
  EPWException,
  EPWExceptionsData,
  exportEPWExceptions,
  importEPWExceptions,
  getBackupInfo,
  restoreFromBackup,
  validateExceptionsIntegrity
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
  const [backupInfo, setBackupInfo] = useState<{ hasBackup: boolean; backupDate?: string; exceptionsCount?: number }>({ hasBackup: false });

  useEffect(() => {
    loadExceptions();
    loadBackupInfo();
  }, []);

  const loadExceptions = () => {
    const data = loadEPWExceptions();
    setExceptionsData(data);
  };

  const loadBackupInfo = () => {
    const info = getBackupInfo();
    setBackupInfo(info);
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
    loadBackupInfo();

    toast.success(`Exceção criada para código: ${newCode.toUpperCase()}`);
  };

  const handleRemoveException = (code: string) => {
    removeEPWException(code);
    loadExceptions();
    loadBackupInfo();
    toast.success(`Exceção removida: ${code}`);
  };

  const handleExportExceptions = () => {
    try {
      const exportData = exportEPWExceptions();
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `epw-exceptions-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('✅ Backup exportado com sucesso');
    } catch (error) {
      toast.error('❌ Erro ao exportar backup');
    }
  };

  const handleImportExceptions = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const success = importEPWExceptions(content);
        
        if (success) {
          loadExceptions();
          loadBackupInfo();
          toast.success('✅ Backup importado com sucesso');
        } else {
          throw new Error('Import failed');
        }
      } catch (error) {
        toast.error('❌ Erro ao importar backup. Verifique o formato do arquivo.');
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  const handleRestoreBackup = () => {
    const success = restoreFromBackup();
    if (success) {
      loadExceptions();
      loadBackupInfo();
      toast.success('✅ Backup restaurado com sucesso');
    } else {
      toast.error('❌ Erro ao restaurar backup');
    }
  };

  const handleValidateIntegrity = () => {
    const validation = validateExceptionsIntegrity();
    
    if (validation.isValid) {
      toast.success('✅ Todas as exceções estão válidas e íntegras');
    } else {
      toast.error(`⚠️ ${validation.errors.length} erro(s) encontrado(s)`);
    }
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
        {/* Backup and Management Tools */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-blue-800 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Sistema de Backup
            </h4>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleValidateIntegrity}>
                <CheckCircle className="w-4 h-4" />
              </Button>
              {backupInfo.hasBackup && (
                <Button size="sm" variant="outline" onClick={handleRestoreBackup}>
                  Restaurar Auto-Backup
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={handleExportExceptions} className="gap-2">
              <Download className="w-4 h-4" />
              Exportar Backup
            </Button>
            
            <label className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer">
              <Upload className="w-4 h-4" />
              Importar Backup
              <input
                type="file"
                accept=".json"
                onChange={handleImportExceptions}
                className="hidden"
              />
            </label>
          </div>

          {backupInfo.hasBackup && (
            <div className="text-xs text-blue-700">
              💾 Auto-backup disponível: {backupInfo.exceptionsCount} exceções 
              ({backupInfo.backupDate ? new Date(backupInfo.backupDate).toLocaleString() : 'Data desconhecida'})
            </div>
          )}
        </div>

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

        <div className="text-xs text-orange-700 bg-orange-100 p-3 rounded space-y-1">
          <div className="flex items-center gap-2 font-semibold">
            <Shield className="w-4 h-4" />
            ARMAZENAMENTO PERMANENTE GARANTIDO
          </div>
          <div>
            ✅ Exceções guardadas permanentemente no localStorage<br/>
            ✅ Auto-backup criado em cada operação<br/>
            ✅ NÃO são apagadas durante atualizações de código<br/>
            ✅ Sistema de backup/restore integrado
          </div>
        </div>
      </CardContent>
    </Card>
  );
};