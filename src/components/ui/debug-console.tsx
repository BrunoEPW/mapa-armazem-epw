import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Copy, X, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'log';
  message: string;
  stack?: string;
}

const DebugConsole = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();
  const isCapturingRef = useRef(false);

  const addLog = useCallback((level: LogEntry['level'], args: any[]) => {
    // Prevent infinite loops by checking if we're already capturing
    if (isCapturingRef.current) return;
    
    try {
      isCapturingRef.current = true;
      
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');

      const logEntry: LogEntry = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        level,
        message,
        stack: level === 'error' && args[0]?.stack ? args[0].stack : undefined
      };

      setLogs(prev => [logEntry, ...prev].slice(0, 100)); // Keep last 100 logs
    } catch (error) {
      // Silently ignore errors to prevent infinite loops
    } finally {
      isCapturingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Capture console errors
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;
    const originalInfo = console.info;

    console.error = (...args) => {
      originalError(...args);
      addLog('error', args);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog('warn', args);
    };

    console.log = (...args) => {
      originalLog(...args);
      addLog('log', args);
    };

    console.info = (...args) => {
      originalInfo(...args);
      addLog('info', args);
    };

    // Capture unhandled errors
    const handleError = (event: ErrorEvent) => {
      addLog('error', [event.error?.message || event.message, event.error]);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      addLog('error', ['Unhandled Promise Rejection:', event.reason]);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      console.log = originalLog;
      console.info = originalInfo;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [addLog]);

  const copyLog = (log: LogEntry) => {
    const text = `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}${log.stack ? '\nStack: ' + log.stack : ''}`;
    navigator.clipboard.writeText(text);
    toast({
      title: "Log copiado",
      description: "Log copiado para a área de transferência",
    });
  };

  const copyAllLogs = () => {
    const text = logs.map(log => 
      `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}${log.stack ? '\nStack: ' + log.stack : ''}`
    ).join('\n\n');
    navigator.clipboard.writeText(text);
    toast({
      title: "Todos os logs copiados",
      description: "Todos os logs foram copiados para a área de transferência",
    });
  };

  const clearLogs = () => {
    setLogs([]);
    toast({
      title: "Logs limpos",
      description: "Todos os logs foram removidos",
    });
  };

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'destructive';
      case 'warn': return 'secondary';
      case 'info': return 'default';
      case 'log': return 'outline';
      default: return 'outline';
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-background/80 backdrop-blur-sm"
        >
          Debug Console ({logs.length})
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-w-[90vw]">
      <Card className="bg-background/95 backdrop-blur-sm border-2">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Debug Console</CardTitle>
            <div className="flex gap-1">
              <Button
                onClick={copyAllLogs}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                disabled={logs.length === 0}
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                onClick={clearLogs}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                disabled={logs.length === 0}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              <Button
                onClick={() => setIsVisible(false)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2">
          <ScrollArea className="h-64">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground p-2">Nenhum log capturado</p>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2 rounded border bg-card/50 hover:bg-card/80 transition-colors cursor-pointer"
                    onClick={() => copyLog(log)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getLevelColor(log.level)} className="text-xs">
                        {log.level.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{log.timestamp}</span>
                    </div>
                    <p className="text-xs font-mono break-all">{log.message}</p>
                    {log.stack && (
                      <p className="text-xs font-mono text-muted-foreground mt-1 break-all">
                        {log.stack.split('\n')[0]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Clique num log para copiar
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DebugConsole;