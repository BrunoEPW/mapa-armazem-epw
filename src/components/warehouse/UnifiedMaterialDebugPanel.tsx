import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Database, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { 
  getSystemStats, 
  cleanLegacyData, 
  setPreservationEnabled,
  loadMaterials 
} from '@/utils/unifiedMaterialManager';

interface UnifiedMaterialDebugPanelProps {
  materials: any[];
  onMaterialsRestore?: (materials: any[]) => void;
}

export const UnifiedMaterialDebugPanel: React.FC<UnifiedMaterialDebugPanelProps> = ({
  materials,
  onMaterialsRestore
}) => {
  const [stats, setStats] = React.useState(getSystemStats());

  const refreshStats = () => {
    setStats(getSystemStats());
  };

  const handleRestoreMaterials = () => {
    const restored = loadMaterials();
    if (restored && restored.length > 0) {
      onMaterialsRestore?.(restored);
      toast.success(`${restored.length} materiais restaurados!`);
      refreshStats();
    } else {
      toast.error('Nenhum backup encontrado para restaurar');
    }
  };

  const handleCleanLegacyData = () => {
    cleanLegacyData();
    toast.success('Dados antigos limpos');
    refreshStats();
  };

  const handleTogglePreservation = () => {
    const newState = !stats.preservationEnabled;
    setPreservationEnabled(newState);
    toast.success(`Preservação ${newState ? 'ativada' : 'desativada'}`);
    refreshStats();
  };

  React.useEffect(() => {
    refreshStats();
  }, [materials]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Sistema Unificado de Materiais
          <Badge variant={stats.preservationEnabled ? "default" : "secondary"}>
            {stats.preservationEnabled ? "Ativo" : "Inativo"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Materiais Atuais:</strong> {materials.length}
          </div>
          <div>
            <strong>Backup Disponível:</strong> 
            <Badge variant={stats.hasBackup ? "default" : "secondary"} className="ml-2">
              {stats.hasBackup ? "Sim" : "Não"}
            </Badge>
          </div>
          <div>
            <strong>Sessão:</strong> {stats.session.substring(0, 12)}...
          </div>
          <div>
            <strong>Última Atividade:</strong> {stats.lastActivity}
          </div>
        </div>

        {stats.metadata && (
          <div className="bg-muted p-3 rounded-lg">
            <h4 className="font-medium mb-2">Informações do Backup:</h4>
            <div className="space-y-1 text-sm">
              <div>Materiais: {stats.metadata.count}</div>
              <div>Fonte: {stats.metadata.source}</div>
              <div>Data: {new Date(stats.metadata.timestamp).toLocaleString()}</div>
              <div>Versão: {stats.metadata.version}</div>
            </div>
          </div>
        )}

        <Separator />

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTogglePreservation}
          >
            {stats.preservationEnabled ? "Desativar" : "Ativar"} Preservação
          </Button>

          {stats.hasBackup && (
            <Button
              variant="default"
              size="sm"
              onClick={handleRestoreMaterials}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Restaurar Backup
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleCleanLegacyData}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Limpar Dados Antigos
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={refreshStats}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Sistema Unificado Ativo:</strong> Este painel substitui os sistemas antigos 
              conflituantes. Os materiais são agora geridos de forma inteligente e apenas 
              dados reais do usuário são preservados.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};