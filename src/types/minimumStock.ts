export interface MinimumStock {
  id: string;
  productKey: string; // modelo_acabamento_cor_comprimento
  modelo: string;
  acabamento: string;
  cor: string;
  comprimento: number;
  minimumQuantity: number;
  dateSet: string;
  notes?: string;
}

export interface StockAlert {
  productKey: string;
  modelo: string;
  acabamento: string;
  cor: string;
  comprimento: number;
  currentStock: number;
  minimumStock: number;
  deficit: number;
  status: 'ok' | 'low' | 'critical';
}

export interface MinimumStockSummary {
  totalProductsWithMinimum: number;
  productsOk: number;
  productsLow: number;
  productsCritical: number;
  alerts: StockAlert[];
}