import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { loadExclusions, STORAGE_KEYS } from '@/lib/storage';
import { toast } from 'sonner';

export const ExclusionsDebugPanel: React.FC = () => {
  const [debugInfo, setDebugInfo] = React.useState<any>(null);

  const diagnoseExclusions = () => {
    try {
      console.log('🔍 [ExclusionsDebugPanel] Running comprehensive diagnosis...');
      
      // Check all possible storage keys
      const mainData = localStorage.getItem(STORAGE_KEYS.EXCLUSIONS);
      const backup1 = localStorage.getItem(`${STORAGE_KEYS.EXCLUSIONS}-backup-1`);
      const backup2 = localStorage.getItem(`${STORAGE_KEYS.EXCLUSIONS}-backup-2`);
      const emergency = localStorage.getItem(`${STORAGE_KEYS.EXCLUSIONS}-emergency`);
      
      // Load current exclusions
      const currentExclusions = loadExclusions();
      
      // Get localStorage info
      const storageInfo = {
        totalKeys: Object.keys(localStorage).length,
        exclusionKeys: Object.keys(localStorage).filter(key => key.includes('exclusions')),
        availableSpace: (() => {
          try {
            const test = 'test';
            localStorage.setItem('storage-test', test);
            localStorage.removeItem('storage-test');
            return 'Available';
          } catch {
            return 'Full/Error';
          }
        })()
      };
      
      const info = {
        timestamp: new Date().toISOString(),
        currentExclusions,
        storageData: {
          main: mainData ? JSON.parse(mainData) : null,
          backup1: backup1 ? JSON.parse(backup1) : null,
          backup2: backup2 ? JSON.parse(backup2) : null,
          emergency: emergency ? JSON.parse(emergency) : null,
        },
        storageInfo,
        consistency: {
          mainExists: !!mainData,
          backup1Exists: !!backup1,
          backup2Exists: !!backup2,
          emergencyExists: !!emergency,
          allMatch: mainData === backup1 && backup1 === backup2
        }
      };
      
      setDebugInfo(info);
      console.log('🔍 [ExclusionsDebugPanel] Diagnosis complete:', info);
      toast.success('Diagnóstico das exclusões concluído');
    } catch (error) {
      console.error('❌ [ExclusionsDebugPanel] Diagnosis failed:', error);
      toast.error('Erro no diagnóstico das exclusões');
    }
  };

  const exportExclusions = () => {
    try {
      const data = loadExclusions();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `exclusions-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Exclusões exportadas com sucesso');
    } catch (error) {
      console.error('❌ [ExclusionsDebugPanel] Export failed:', error);
      toast.error('Erro ao exportar exclusões');
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Diagnóstico das Exclusões
          <Badge variant="outline">Debug Tool</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={diagnoseExclusions} variant="outline">
            Executar Diagnóstico
          </Button>
          <Button onClick={exportExclusions} variant="outline">
            Exportar Exclusões
          </Button>
        </div>
        
        {debugInfo && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Estado Atual das Exclusões</h3>
              <pre className="bg-muted p-3 rounded text-sm overflow-auto max-h-40">
                {JSON.stringify(debugInfo.currentExclusions, null, 2)}
              </pre>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Consistência dos Backups</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Badge variant={debugInfo.consistency.mainExists ? "default" : "destructive"}>
                  Principal: {debugInfo.consistency.mainExists ? "✓" : "✗"}
                </Badge>
                <Badge variant={debugInfo.consistency.backup1Exists ? "default" : "destructive"}>
                  Backup 1: {debugInfo.consistency.backup1Exists ? "✓" : "✗"}
                </Badge>
                <Badge variant={debugInfo.consistency.backup2Exists ? "default" : "destructive"}>
                  Backup 2: {debugInfo.consistency.backup2Exists ? "✓" : "✗"}
                </Badge>
                <Badge variant={debugInfo.consistency.allMatch ? "default" : "secondary"}>
                  Sincronizado: {debugInfo.consistency.allMatch ? "✓" : "≠"}
                </Badge>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Informações do Storage</h3>
              <div className="text-sm space-y-1">
                <p>Total de chaves: {debugInfo.storageInfo.totalKeys}</p>
                <p>Chaves de exclusões: {debugInfo.storageInfo.exclusionKeys.length}</p>
                <p>Espaço disponível: {debugInfo.storageInfo.availableSpace}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};