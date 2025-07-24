import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useProductWebService } from '@/hooks/useProductWebService';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

export const SyncStatusIndicator: React.FC = () => {
  const { syncStatus, syncProducts, clearCache } = useProductWebService();

  const getStatusIcon = () => {
    if (syncStatus.isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (syncStatus.error) {
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
    if (syncStatus.lastSync) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  const getStatusText = () => {
    if (syncStatus.isLoading) return "Sincronizando...";
    if (syncStatus.error) return "Erro na sincronização";
    if (syncStatus.lastSync) return "Sincronizado";
    return "Aguardando sincronização";
  };

  const getStatusVariant = (): "default" | "secondary" | "destructive" | "outline" => {
    if (syncStatus.isLoading) return "secondary";
    if (syncStatus.error) return "destructive";
    if (syncStatus.lastSync) return "default";
    return "outline";
  };

  const handleForceSync = async () => {
    clearCache();
    await syncProducts();
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {getStatusIcon()}
          Estado da Sincronização
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant={getStatusVariant()} className="flex items-center gap-1">
            {getStatusText()}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleForceSync}
            disabled={syncStatus.isLoading}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${syncStatus.isLoading ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>
        </div>

        {syncStatus.lastSync && (
          <div className="text-xs text-muted-foreground">
            Última sincronização: {format(syncStatus.lastSync, "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
          </div>
        )}

        {syncStatus.totalSynced > 0 && (
          <div className="text-xs text-muted-foreground">
            Total de produtos: {syncStatus.totalSynced}
          </div>
        )}

        {syncStatus.error && (
          <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
            {syncStatus.error}
          </div>
        )}
      </CardContent>
    </Card>
  );
};