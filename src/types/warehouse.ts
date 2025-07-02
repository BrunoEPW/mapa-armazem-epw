export interface Product {
  id: string;
  modelo: string;
  acabamento: string;
  cor: string;
  comprimento: number;
  foto?: string;
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
    B: { name: 'B', prateleiras: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] },
    C: { name: 'C', prateleiras: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] },
    D: { name: 'D', prateleiras: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] },
    E: { name: 'E', prateleiras: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] },
    F: { name: 'F', prateleiras: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] },
    G: { name: 'G', prateleiras: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] },
    H: { name: 'H', prateleiras: [1, 2, 3, 4, 5, 6, 7] },
  },
};