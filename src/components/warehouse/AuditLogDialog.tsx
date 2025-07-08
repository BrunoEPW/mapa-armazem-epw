import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { History, User, Calendar, Filter, RefreshCw } from 'lucide-react';
import { useAuditLog, AuditLogEntry } from '@/hooks/useAuditLog';
import { useAuth } from '@/contexts/AuthContext';

interface AuditLogDialogProps {
  onClose: () => void;
}

export const AuditLogDialog: React.FC<AuditLogDialogProps> = ({ onClose }) => {
  const { hasPermission } = useAuth();
  const { auditLogs, loading, getAuditLogs, getRecentActivity } = useAuditLog();
  const [filter, setFilter] = useState({
    table: '',
    action: '',
    timeRange: '24',
  });

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    if (filter.timeRange) {
      await getRecentActivity(parseInt(filter.timeRange));
    } else {
      await getAuditLogs(filter.table || undefined);
    }
  };

  const handleFilterChange = async () => {
    await loadAuditLogs();
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'default';
      case 'UPDATE':
        return 'secondary';
      case 'DELETE':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'Criação';
      case 'UPDATE':
        return 'Atualização';
      case 'DELETE':
        return 'Eliminação';
      default:
        return action;
    }
  };

  const getTableLabel = (table: string) => {
    switch (table) {
      case 'products':
        return 'Produtos';
      case 'materials':
        return 'Materiais';
      case 'movements':
        return 'Movimentos';
      default:
        return table;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-PT');
  };

  const formatChanges = (oldValues?: Record<string, any>, newValues?: Record<string, any>) => {
    const changes: string[] = [];
    
    if (newValues) {
      Object.entries(newValues).forEach(([key, value]) => {
        if (oldValues && oldValues[key] !== value) {
          changes.push(`${key}: ${oldValues[key]} → ${value}`);
        } else if (!oldValues) {
          changes.push(`${key}: ${value}`);
        }
      });
    }
    
    return changes.length > 0 ? changes.join(', ') : 'Sem alterações registadas';
  };

  if (!hasPermission('canViewReports')) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Acesso Negado</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              Não tem permissão para visualizar registos de auditoria.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Auditoria e Histórico de Alterações
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="w-5 h-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium">Tabela</label>
                  <Select value={filter.table} onValueChange={(value) => setFilter(prev => ({ ...prev, table: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as tabelas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas</SelectItem>
                      <SelectItem value="products">Produtos</SelectItem>
                      <SelectItem value="materials">Materiais</SelectItem>
                      <SelectItem value="movements">Movimentos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Ação</label>
                  <Select value={filter.action} onValueChange={(value) => setFilter(prev => ({ ...prev, action: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as ações" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas</SelectItem>
                      <SelectItem value="INSERT">Criação</SelectItem>
                      <SelectItem value="UPDATE">Atualização</SelectItem>
                      <SelectItem value="DELETE">Eliminação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Período</label>
                  <Select value={filter.timeRange} onValueChange={(value) => setFilter(prev => ({ ...prev, timeRange: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Última hora</SelectItem>
                      <SelectItem value="24">Últimas 24 horas</SelectItem>
                      <SelectItem value="168">Última semana</SelectItem>
                      <SelectItem value="720">Último mês</SelectItem>
                      <SelectItem value="">Todos os registos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button onClick={handleFilterChange} disabled={loading} className="w-full">
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audit Logs */}
          <Card>
            <CardHeader>
              <CardTitle>
                Registos de Atividade ({auditLogs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p>A carregar registos...</p>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum registo encontrado com os critérios selecionados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={getActionBadgeVariant(log.action)}>
                            {getActionLabel(log.action)}
                          </Badge>
                          <Badge variant="outline">
                            {getTableLabel(log.table_name)}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(log.created_at)}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4" />
                          <span className="font-medium">{log.user_name}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">ID: {log.record_id}</span>
                        </div>

                        {(log.old_values || log.new_values) && (
                          <div className="text-sm">
                            <p className="font-medium mb-1">Alterações:</p>
                            <p className="text-muted-foreground">
                              {formatChanges(log.old_values, log.new_values)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};