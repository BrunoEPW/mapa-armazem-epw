import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'log';
  message: string;
}

const SimpleDebugConsole = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    // Only capture console.log to avoid infinite loops
    const originalLog = console.log;

    console.log = (...args) => {
      originalLog(...args);
      
      // Only add logs that contain our debug markers
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');

      if (message.includes('=== ') || message.includes('DEBUG') || message.includes('Error') || message.includes('ERROR')) {
        const logEntry: LogEntry = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toLocaleTimeString(),
          level: 'log',
          message,
        };

        setLogs(prev => [logEntry, ...prev].slice(0, 50)); // Keep last 50 logs
      }
    };

    return () => {
      console.log = originalLog;
    };
  }, []);

  const clearLogs = () => {
    setLogs([]);
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

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Debug Console</CardTitle>
          <Button
            onClick={clearLogs}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            disabled={logs.length === 0}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-2">
        <ScrollArea className="h-48">
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground p-2">Nenhum log de debug capturado</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-2 rounded border bg-card/50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getLevelColor(log.level)} className="text-xs">
                      {log.level.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{log.timestamp}</span>
                  </div>
                  <p className="text-xs font-mono break-all">{log.message}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Logs de debug aparecerão aqui
        </p>
      </CardContent>
    </Card>
  );
};

export default SimpleDebugConsole;