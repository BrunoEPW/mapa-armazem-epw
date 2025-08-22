import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Bug, Wifi, WifiOff, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { MaterialPreservationPanel } from '@/components/warehouse/MaterialPreservationPanel';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  details?: any;
}

interface SystemInfo {
  userAgent: string;
  url: string;
  timestamp: string;
  viewport: string;
  online: boolean;
  connectionType?: string;
}

interface DebugPanelProps {
  additionalInfo?: Record<string, any>;
  materials?: any[];
  onMaterialsRestore?: (materials: any[]) => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ 
  additionalInfo, 
  materials = [], 
  onMaterialsRestore 
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [systemInfo, setSystemInfo] = useState<SystemInfo>();

  // Capturar logs automaticamente
  useEffect(() => {
    const originalConsole = {
      error: console.error,
      warn: console.warn,
      info: console.info,
      log: console.log,
    };

    const createLogEntry = (level: LogEntry['level'], args: any[]): LogEntry => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toLocaleTimeString('pt-PT'),
      level,
      message: args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '),
      details: args.length > 1 ? args.slice(1) : undefined,
    });

    console.error = (...args) => {
      originalConsole.error(...args);
      setLogs(prev => [...prev.slice(-49), createLogEntry('error', args)]);
    };

    console.warn = (...args) => {
      originalConsole.warn(...args);
      setLogs(prev => [...prev.slice(-49), createLogEntry('warn', args)]);
    };

    console.info = (...args) => {
      originalConsole.info(...args);
      setLogs(prev => [...prev.slice(-49), createLogEntry('info', args)]);
    };

    // Capturar erros não tratados
    const handleUnhandledError = (event: ErrorEvent) => {
      setLogs(prev => [...prev.slice(-49), createLogEntry('error', [
        `Erro não tratado: ${event.message}`,
        `Arquivo: ${event.filename}:${event.lineno}:${event.colno}`,
        event.error
      ])]);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setLogs(prev => [...prev.slice(-49), createLogEntry('error', [
        'Promise rejeitada não tratada:',
        event.reason
      ])]);
    };

    window.addEventListener('error', handleUnhandledError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Informações do sistema
    const updateSystemInfo = () => {
      setSystemInfo({
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toLocaleString('pt-PT'),
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        online: navigator.onLine,
        connectionType: (navigator as any).connection?.effectiveType || 'unknown',
      });
    };

    updateSystemInfo();
    window.addEventListener('resize', updateSystemInfo);
    window.addEventListener('online', updateSystemInfo);
    window.addEventListener('offline', updateSystemInfo);

    return () => {
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      console.info = originalConsole.info;
      window.removeEventListener('error', handleUnhandledError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('resize', updateSystemInfo);
      window.removeEventListener('online', updateSystemInfo);
      window.removeEventListener('offline', updateSystemInfo);
    };
  }, []);

  const copyAllLogs = () => {
    const debugInfo = {
      systemInfo,
      additionalInfo,
      logs: logs.map(log => ({
        time: log.timestamp,
        level: log.level,
        message: log.message,
        details: log.details
      })),
      exportedAt: new Date().toISOString(),
    };

    const text = JSON.stringify(debugInfo, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Informações de debug copiadas!');
    }).catch(() => {
      toast.error('Erro ao copiar para área de transferência');
    });
  };

  const clearLogs = () => {
    setLogs([]);
    toast.info('Logs limpos');
  };

  const downloadLogs = () => {
    const debugInfo = {
      systemInfo,
      additionalInfo,
      logs,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(debugInfo, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString().slice(0, 19)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Logs exportados!');
  };

  const getLogLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'bg-destructive text-destructive-foreground';
      case 'warn': return 'bg-yellow-500 text-white';
      case 'info': return 'bg-blue-500 text-white';
      case 'debug': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-4 right-4 z-50 bg-background/80 backdrop-blur-sm border-2"
        >
          <Bug className="h-4 w-4 mr-2" />
          Debug
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] w-[90vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Painel de Debug
            <Badge variant={systemInfo?.online ? "default" : "destructive"}>
              {systemInfo?.online ? (
                <>
                  <Wifi className="h-3 w-3 mr-1" />
                  Online
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </>
              )}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button onClick={copyAllLogs} size="sm">
            <Copy className="h-4 w-4 mr-2" />
            Copiar Tudo
          </Button>
          <Button onClick={downloadLogs} size="sm" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={clearLogs} size="sm" variant="outline">
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        </div>

        <Tabs defaultValue="logs" className="h-full">
          <TabsList>
            <TabsTrigger value="logs">
              Logs ({logs.length})
            </TabsTrigger>
            <TabsTrigger value="preservation">
              Preservação
            </TabsTrigger>
            <TabsTrigger value="system">Sistema</TabsTrigger>
            {additionalInfo && (
              <TabsTrigger value="app">App Info</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="logs" className="h-[400px]">
            <ScrollArea className="h-full w-full border rounded-md p-4">
              {logs.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum log registado ainda...
                </p>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div key={log.id} className="border rounded p-2 text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getLogLevelColor(log.level)} variant="secondary">
                          {log.level.toUpperCase()}
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          {log.timestamp}
                        </span>
                      </div>
                      <pre className="whitespace-pre-wrap font-mono text-xs">
                        {log.message}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="preservation" className="h-[400px]">
            <ScrollArea className="h-full">
              <MaterialPreservationPanel 
                materials={materials}
                onMaterialsRestore={onMaterialsRestore}
              />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="system" className="h-[400px]">
            <ScrollArea className="h-full">
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Sistema</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {systemInfo && (
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div><strong>URL:</strong> {systemInfo.url}</div>
                      <div><strong>Timestamp:</strong> {systemInfo.timestamp}</div>
                      <div><strong>Viewport:</strong> {systemInfo.viewport}</div>
                      <div><strong>Online:</strong> {systemInfo.online ? 'Sim' : 'Não'}</div>
                      <div><strong>Tipo de Conexão:</strong> {systemInfo.connectionType}</div>
                      <div><strong>User Agent:</strong> 
                        <pre className="mt-1 text-xs bg-muted p-2 rounded whitespace-pre-wrap">
                          {systemInfo.userAgent}
                        </pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </ScrollArea>
          </TabsContent>

          {additionalInfo && (
            <TabsContent value="app" className="h-[400px]">
              <ScrollArea className="h-full">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações da Aplicação</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-muted p-4 rounded whitespace-pre-wrap">
                      {JSON.stringify(additionalInfo, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </ScrollArea>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};