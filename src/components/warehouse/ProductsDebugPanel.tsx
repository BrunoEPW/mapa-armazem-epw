import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, CheckCheck, Bug, Wifi, Database, Filter, Eye, RefreshCw } from 'lucide-react';
import { Product } from '@/types/warehouse';
import { ApiFilters } from '@/services/apiService';
import { ExclusionSettings } from '@/lib/storage';
import { toast } from 'sonner';

interface ProductsDebugPanelProps {
  // Products data
  products: Product[];
  loading: boolean;
  error: string | null;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  totalCount: number;
  itemsPerPage: number;
  
  // Connection status
  isConnected: boolean;
  connectionStatus: string;
  
  // Filters
  activeFilters: ApiFilters;
  epwFilters: any;
  searchQuery: string;
  
  // Exclusions
  exclusions: ExclusionSettings;
  debugMode: boolean;
  
  // Actions
  onRefresh: () => void;
  onClearCache: () => void;
  onToggleDebugMode: () => void;
}

export const ProductsDebugPanel: React.FC<ProductsDebugPanelProps> = ({
  products,
  loading,
  error,
  currentPage,
  totalPages,
  totalCount,
  itemsPerPage,
  isConnected,
  connectionStatus,
  activeFilters,
  epwFilters,
  searchQuery,
  exclusions,
  debugMode,
  onRefresh,
  onClearCache,
  onToggleDebugMode
}) => {
  const [copied, setCopied] = useState(false);

  // Generate comprehensive debug report
  const generateDebugReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      page: '/produtos',
      
      // Products Status
      productsStatus: {
        loading,
        error,
        productsCount: products.length,
        totalCount,
        currentPage,
        totalPages,
        itemsPerPage,
        hasProducts: products.length > 0,
        firstProduct: products[0] || null,
        lastProduct: products[products.length - 1] || null
      },
      
      // API Connection
      apiConnection: {
        isConnected,
        connectionStatus,
        hasError: !!error,
        errorMessage: error
      },
      
      // Filters
      filtersStatus: {
        hasActiveFilters: Object.keys(activeFilters).length > 0,
        activeFilters,
        epwFilters,
        searchQuery,
        searchLength: searchQuery.length
      },
      
      // Exclusions
      exclusionsStatus: {
        enabled: exclusions.enabled,
        prefixesCount: exclusions.prefixes.length,
        prefixes: exclusions.prefixes,
        debugMode,
        createdAt: exclusions.createdAt,
        updatedAt: exclusions.updatedAt
      },
      
      // Browser Info
      browserInfo: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        localStorage: {
          exclusionsSize: localStorage.getItem('warehouse-exclusions')?.length || 0,
          exclusionsBackupSize: localStorage.getItem('warehouse-exclusions-backup-1')?.length || 0
        }
      },
      
      // Potential Issues
      potentialIssues: []
    };

    // Analyze potential issues
    if (!isConnected && !error) {
      report.potentialIssues.push("API desconectada mas sem erro explícito");
    }
    
    if (totalCount > 0 && products.length === 0 && !loading) {
      report.potentialIssues.push(`API claims ${totalCount} products exist but array is empty`);
    }
    
    if (exclusions.enabled && exclusions.prefixes.length > 10) {
      report.potentialIssues.push(`Muitas exclusões ativas (${exclusions.prefixes.length}) podem filtrar todos os produtos`);
    }
    
    if (Object.keys(activeFilters).length > 0 && products.length === 0) {
      report.potentialIssues.push("Filtros podem estar muito restritivos");
    }

    return report;
  };

  const copyDebugInfo = async () => {
    const report = generateDebugReport();
    const formattedReport = JSON.stringify(report, null, 2);
    
    try {
      await navigator.clipboard.writeText(formattedReport);
      setCopied(true);
      toast.success('Informações de debug copiadas para o clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy debug info:', err);
      toast.error('Erro ao copiar informações de debug');
    }
  };

  const report = generateDebugReport();

  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="w-5 h-5" />
          Debug Panel - Produtos
          <Badge variant={debugMode ? "default" : "secondary"}>
            {debugMode ? "Debug ON" : "Debug OFF"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={onToggleDebugMode} variant={debugMode ? "default" : "outline"} size="sm">
            <Eye className="w-4 h-4 mr-1" />
            {debugMode ? "Desativar Debug" : "Ativar Debug"}
          </Button>
          <Button onClick={onRefresh} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh API
          </Button>
          <Button onClick={onClearCache} variant="outline" size="sm">
            <Database className="w-4 h-4 mr-1" />
            Limpar Cache
          </Button>
          <Button onClick={copyDebugInfo} variant="outline" size="sm">
            {copied ? <CheckCheck className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
            {copied ? "Copiado!" : "Copiar Debug Info"}
          </Button>
        </div>

        <Separator />

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span className="font-medium">Produtos</span>
            </div>
            <div className="text-sm space-y-1">
              <div>Carregados: <Badge>{products.length}</Badge></div>
              <div>Total API: <Badge>{totalCount}</Badge></div>
              <div>Página: <Badge>{currentPage}/{totalPages}</Badge></div>
              <div>Status: <Badge variant={loading ? "secondary" : products.length > 0 ? "default" : "destructive"}>
                {loading ? "Carregando" : products.length > 0 ? "OK" : "Vazio"}
              </Badge></div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              <span className="font-medium">API</span>
            </div>
            <div className="text-sm space-y-1">
              <div>Conectada: <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? "Sim" : "Não"}
              </Badge></div>
              <div>Status: <span className="text-xs">{connectionStatus}</span></div>
              {error && <div className="text-destructive text-xs">Erro: {error}</div>}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="font-medium">Filtros</span>
            </div>
            <div className="text-sm space-y-1">
              <div>API Filters: <Badge>{Object.keys(activeFilters).length}</Badge></div>
              <div>EPW Filters: <Badge>{Object.values(epwFilters).filter(v => v && v !== 'all').length}</Badge></div>
              <div>Pesquisa: <Badge>{searchQuery ? "Ativa" : "Inativa"}</Badge></div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span className="font-medium">Exclusões</span>
            </div>
            <div className="text-sm space-y-1">
              <div>Estado: <Badge variant={exclusions.enabled && !debugMode ? "destructive" : "default"}>
                {exclusions.enabled && !debugMode ? "Ativas" : "Inativas"}
              </Badge></div>
              <div>Prefixos: <Badge>{exclusions.prefixes.length}</Badge></div>
              <div>Debug Mode: <Badge variant={debugMode ? "default" : "secondary"}>
                {debugMode ? "ON" : "OFF"}
              </Badge></div>
            </div>
          </div>
        </div>

        {/* Issues Alert */}
        {report.potentialIssues.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium text-destructive">⚠️ Problemas Detectados:</h4>
              <ul className="text-sm space-y-1">
                {report.potentialIssues.map((issue, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-destructive">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Detailed Status */}
        <Separator />
        <details className="space-y-2">
          <summary className="cursor-pointer font-medium">Detalhes Técnicos</summary>
          <div className="text-xs bg-muted p-4 rounded-md font-mono overflow-x-auto">
            <pre>{JSON.stringify(report, null, 2)}</pre>
          </div>
        </details>
      </CardContent>
    </Card>
  );
};