import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  ShieldCheck, 
  ShieldX, 
  RotateCcw, 
  Archive, 
  Clock,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  isMaterialPreservationEnabled,
  enableMaterialPreservation,
  restoreMaterialsFromBackup,
  clearPreservationData,
  PRESERVATION_KEYS
} from '@/utils/materialPreservation';

interface MaterialPreservationPanelProps {
  materials: any[];
  onMaterialsRestore?: (materials: any[]) => void;
}

export const MaterialPreservationPanel = ({ 
  materials, 
  onMaterialsRestore 
}: MaterialPreservationPanelProps) => {
  const [preservationEnabled, setPreservationEnabled] = useState(false);
  const [backupInfo, setBackupInfo] = useState<{
    hasBackup: boolean;
    backupCount: number;
    backupDate: string | null;
    restoreAttempts: number;
  }>({
    hasBackup: false,
    backupCount: 0,
    backupDate: null,
    restoreAttempts: 0
  });

  // Carregar estado atual da preservação
  useEffect(() => {
    const enabled = isMaterialPreservationEnabled();
    setPreservationEnabled(enabled);
    
    // Verificar informações do backup
    checkBackupInfo();
  }, []);

  const checkBackupInfo = () => {
    try {
      const backupData = localStorage.getItem(PRESERVATION_KEYS.MATERIALS_BACKUP);
      const restoreAttempts = parseInt(localStorage.getItem(PRESERVATION_KEYS.MATERIALS_RESTORE_ATTEMPTS) || '0');
      
      if (backupData) {
        const backup = JSON.parse(backupData);
        const materials = backup.materials || backup;
        const metadata = backup.metadata;
        
        setBackupInfo({
          hasBackup: true,
          backupCount: Array.isArray(materials) ? materials.length : 0,
          backupDate: metadata?.timestamp ? new Date(metadata.timestamp).toLocaleString() : null,
          restoreAttempts
        });
      } else {
        setBackupInfo({
          hasBackup: false,
          backupCount: 0,
          backupDate: null,
          restoreAttempts
        });
      }
    } catch (error) {
      console.error('Erro ao verificar backup:', error);
    }
  };

  const handleTogglePreservation = () => {
    const newEnabled = !preservationEnabled;
    
    if (newEnabled) {
      enableMaterialPreservation();
      toast.success('Preservação de materiais ativada!');
    } else {
      localStorage.setItem(PRESERVATION_KEYS.MATERIALS_PRESERVATION_ENABLED, 'false');
      toast.warning('Preservação de materiais desativada!');
    }
    
    setPreservationEnabled(newEnabled);
  };

  const handleRestoreFromBackup = () => {
    const restoredMaterials = restoreMaterialsFromBackup();
    
    if (restoredMaterials && restoredMaterials.length > 0) {
      onMaterialsRestore?.(restoredMaterials);
      toast.success(`${restoredMaterials.length} materiais restaurados do backup!`);
      checkBackupInfo(); // Atualizar informações
    } else {
      toast.error('Nenhum backup encontrado ou backup vazio');
    }
  };

  const handleClearPreservationData = () => {
    if (confirm('Tem certeza que deseja limpar todos os dados de preservação? Esta ação não pode ser desfeita.')) {
      clearPreservationData();
      checkBackupInfo();
      toast.success('Dados de preservação limpos');
    }
  };

  const getStatusIcon = () => {
    if (preservationEnabled) {
      return backupInfo.hasBackup ? (
        <ShieldCheck className="w-5 h-5 text-green-500" />
      ) : (
        <Shield className="w-5 h-5 text-yellow-500" />
      );
    }
    return <ShieldX className="w-5 h-5 text-red-500" />;
  };

  const getStatusText = () => {
    if (preservationEnabled) {
      return backupInfo.hasBackup ? 'Ativo com Backup' : 'Ativo sem Backup';
    }
    return 'Inativo';
  };

  const getStatusVariant = (): "default" | "secondary" | "destructive" | "outline" => {
    if (preservationEnabled) {
      return backupInfo.hasBackup ? 'default' : 'secondary';
    }
    return 'destructive';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Sistema de Preservação de Materiais
          <Badge variant={getStatusVariant()}>
            {getStatusText()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggle de Ativação */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="preservation-toggle" className="text-sm font-medium">
              Preservação Automática
            </Label>
            <p className="text-xs text-muted-foreground">
              Protege os materiais das prateleiras durante atualizações
            </p>
          </div>
          <Switch
            id="preservation-toggle"
            checked={preservationEnabled}
            onCheckedChange={handleTogglePreservation}
          />
        </div>

        <Separator />

        {/* Informações do Estado Atual */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4" />
              <span className="font-medium">Materiais Atuais:</span>
            </div>
            <p className="text-muted-foreground">{materials.length} materiais</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="font-medium">Restaurações:</span>
            </div>
            <p className="text-muted-foreground">{backupInfo.restoreAttempts} tentativas</p>
          </div>
        </div>

        {/* Informações do Backup */}
        {backupInfo.hasBackup && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="font-medium text-sm">Backup Disponível</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium">Materiais no Backup:</span>
                  <p>{backupInfo.backupCount}</p>
                </div>
                <div>
                  <span className="font-medium">Data do Backup:</span>
                  <p>{backupInfo.backupDate || 'N/A'}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Aviso se não há backup */}
        {preservationEnabled && !backupInfo.hasBackup && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium text-yellow-700 dark:text-yellow-300">
                Nenhum backup encontrado
              </p>
              <p className="text-yellow-600 dark:text-yellow-400">
                O backup será criado automaticamente quando houver materiais
              </p>
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <Separator />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRestoreFromBackup}
            disabled={!backupInfo.hasBackup}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Restaurar Backup
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={checkBackupInfo}
            className="flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Atualizar Info
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClearPreservationData}
            disabled={!backupInfo.hasBackup}
            className="flex items-center gap-2"
          >
            <ShieldX className="w-4 h-4" />
            Limpar Dados
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};