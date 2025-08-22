import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { ApiFilters } from '@/services/apiService';
import { Product } from '@/types/warehouse';

interface ProductsDebugPanelProps {
  products: Product[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  itemsPerPage: number;
  connectionStatus: string;
  activeFilters: ApiFilters;
  debugMode: boolean;
}

export const ProductsDebugPanel: React.FC<ProductsDebugPanelProps> = ({
  products,
  loading,
  error,
  currentPage,
  totalPages,
  totalCount,
  itemsPerPage,
  connectionStatus,
  activeFilters,
  debugMode,
}) => {
  const [copied, setCopied] = useState(false);

  const debugInfo = `=== PRODUCTS DEBUG INFO ===
    Products Loaded: ${products.length}
    Loading: ${loading}
    Error: ${error || 'None'}
    Current Page: ${currentPage}
    Total Pages: ${totalPages}
    Total Count: ${totalCount}
    Items Per Page: ${itemsPerPage}
    Connection Status: ${connectionStatus}
    Active Filters: ${JSON.stringify(activeFilters, null, 2)}
    Debug Mode: ${debugMode ? 'ON' : 'OFF'}
    
    === FIRST 3 PRODUCTS ===
    ${products.slice(0, 3).map((p, i) => `
    Product ${i + 1}:
      ID: ${p.id}
      Codigo: ${p.codigo}
      Descricao: ${p.descricao}
      Modelo: ${p.modelo}
      EPW Original: ${p.epwOriginalCode || 'N/A'}
    `).join('')}
    
    === TIMESTAMP ===
    Generated: ${new Date().toISOString()}
  `;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(debugInfo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy debug info:', err);
    }
  };

  return (
    <Card className="bg-yellow-50 border-yellow-200">
      <CardHeader>
        <CardTitle className="text-yellow-800 flex items-center gap-2">
          🐛 Products Debug Panel
          <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
            className="ml-auto"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Debug Info'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="text-xs text-yellow-900 bg-yellow-100 p-3 rounded overflow-auto max-h-96">
          {debugInfo}
        </pre>
      </CardContent>
    </Card>
  );
};