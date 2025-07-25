export interface Product {
  id: string;
  familia: string;
  modelo: string;
  acabamento: string;
  cor: string;
  comprimento: number | string;
  foto?: string;
  // API fields
  codigo?: string; // Product code from API (strCodigo)
  descricao?: string; // Product description from API (strDescricao)
  // EPW decoded fields (when available from API)
  epwTipo?: { l: string; d: string };
  epwCertificacao?: { l: string; d: string };
  epwModelo?: { l: string; d: string };
  epwComprimento?: { l: string; d: string };
  epwCor?: { l: string; d: string };
  epwAcabamento?: { l: string; d: string };
  epwOriginalCode?: string; // Original API reference code
}

export interface Material {
  id: string;
  productId: string;
  product: Product;
  pecas: number;
  location: ShelfLocation;
}

export interface ShelfLocation {
  estante: string;
  prateleira: number;
  posicao?: 'esquerda' | 'central' | 'direita';
}

export interface Movement {
  id: string;
  materialId: string;
  type: 'entrada' | 'saida';
  pecas: number;
  norc: string;
  date: string;
}

export interface ShelfData {
  location: ShelfLocation;
  materials: Material[];
  movements: Movement[];
}

export type ShelfStatus = 'empty' | 'low' | 'stock' | 'selected';

export interface WarehouseConfig {
  estantes: {
    [key: string]: {
      name: string;
      prateleiras: number[];
    };
  };
}

export const WAREHOUSE_CONFIG: WarehouseConfig = {
  estantes: {
    A: { name: 'A', prateleiras: [1] },
    B: { name: 'B', prateleiras: [1, 2, 3, 4, 5, 6, 7] },
    C: { name: 'C', prateleiras: [1, 2, 3, 4, 5, 6, 7] },
    D: { name: 'D', prateleiras: [1, 2, 3, 4, 5, 6, 7] },
    E: { name: 'E', prateleiras: [1, 2, 3, 4, 5, 6, 7] },
    F: { name: 'F', prateleiras: [1, 2, 3, 4, 5, 6, 7] },
    G: { name: 'G', prateleiras: [1, 2, 3, 4, 5, 6, 7] },
    H: { name: 'H', prateleiras: [1, 2, 3, 4, 5, 6] },
  },
};