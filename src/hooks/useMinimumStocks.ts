import { useState, useEffect, useCallback } from 'react';
import { MinimumStock, StockAlert, MinimumStockSummary } from '@/types/minimumStock';
import { Material, Product } from '@/types/warehouse';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEY = 'warehouse_minimum_stocks';

export const useMinimumStocks = (materials: Material[], products: Product[]) => {
  const [minimumStocks, setMinimumStocks] = useState<MinimumStock[]>([]);
  const { toast } = useToast();

  // Load minimum stocks from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setMinimumStocks(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading minimum stocks:', error);
      }
    }
  }, []);

  // Save to localStorage whenever minimumStocks changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(minimumStocks));
  }, [minimumStocks]);

  const generateProductKey = (product: Product): string => {
    return `${product.modelo}_${product.acabamento}_${product.cor}_${product.comprimento}`;
  };

  const addMinimumStock = useCallback((product: Product, minimumQuantity: number, notes?: string) => {
    const productKey = generateProductKey(product);
    
    // Check if already exists
    const existingIndex = minimumStocks.findIndex(ms => ms.productKey === productKey);
    
    const newMinimumStock: MinimumStock = {
      id: existingIndex >= 0 ? minimumStocks[existingIndex].id : crypto.randomUUID(),
      productKey,
      modelo: product.modelo,
      acabamento: product.acabamento,
      cor: product.cor,
      comprimento: typeof product.comprimento === 'string' ? parseInt(product.comprimento) : product.comprimento,
      minimumQuantity,
      dateSet: new Date().toISOString(),
      notes
    };

    if (existingIndex >= 0) {
      // Update existing
      setMinimumStocks(prev => prev.map((ms, index) => 
        index === existingIndex ? newMinimumStock : ms
      ));
      toast({
        title: "Stock mínimo atualizado",
        description: `Quantidade mínima para ${product.modelo} atualizada para ${minimumQuantity}`,
      });
    } else {
      // Add new
      setMinimumStocks(prev => [...prev, newMinimumStock]);
      toast({
        title: "Stock mínimo definido",
        description: `Quantidade mínima de ${minimumQuantity} definida para ${product.modelo}`,
      });
    }
  }, [minimumStocks, toast]);

  const removeMinimumStock = useCallback((productKey: string) => {
    setMinimumStocks(prev => prev.filter(ms => ms.productKey !== productKey));
    toast({
      title: "Stock mínimo removido",
      description: "Definição de stock mínimo removida com sucesso",
    });
  }, [toast]);

  const getMinimumStock = useCallback((product: Product): MinimumStock | undefined => {
    const productKey = generateProductKey(product);
    return minimumStocks.find(ms => ms.productKey === productKey);
  }, [minimumStocks]);

  const getCurrentStock = useCallback((product: Product): number => {
    const productKey = generateProductKey(product);
    return materials
      .filter(material => generateProductKey(material.product) === productKey)
      .reduce((sum, material) => sum + material.pecas, 0);
  }, [materials]);

  const getStockAlerts = useCallback((): StockAlert[] => {
    return minimumStocks.map(ms => {
      const currentStock = materials
        .filter(material => generateProductKey(material.product) === ms.productKey)
        .reduce((sum, material) => sum + material.pecas, 0);
      
      const deficit = Math.max(0, ms.minimumQuantity - currentStock);
      let status: 'ok' | 'low' | 'critical' = 'ok';
      
      if (currentStock === 0) {
        status = 'critical';
      } else if (currentStock < ms.minimumQuantity) {
        status = 'low';
      }

      return {
        productKey: ms.productKey,
        modelo: ms.modelo,
        acabamento: ms.acabamento,
        cor: ms.cor,
        comprimento: ms.comprimento,
        currentStock,
        minimumStock: ms.minimumQuantity,
        deficit,
        status
      };
    });
  }, [minimumStocks, materials]);

  const getMinimumStockSummary = useCallback((): MinimumStockSummary => {
    const alerts = getStockAlerts();
    
    return {
      totalProductsWithMinimum: minimumStocks.length,
      productsOk: alerts.filter(alert => alert.status === 'ok').length,
      productsLow: alerts.filter(alert => alert.status === 'low').length,
      productsCritical: alerts.filter(alert => alert.status === 'critical').length,
      alerts
    };
  }, [minimumStocks, getStockAlerts]);

  const getProductsWithMinimumStock = useCallback((): Product[] => {
    return products.filter(product => {
      const productKey = generateProductKey(product);
      return minimumStocks.some(ms => ms.productKey === productKey);
    });
  }, [products, minimumStocks]);

  return {
    minimumStocks,
    addMinimumStock,
    removeMinimumStock,
    getMinimumStock,
    getCurrentStock,
    getStockAlerts,
    getMinimumStockSummary,
    getProductsWithMinimumStock,
    generateProductKey
  };
};