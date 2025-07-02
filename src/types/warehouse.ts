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
    A: { name: 'A', prateleiras: [0] },
    B: { name: 'B', prateleiras: [0, 1, 2, 3, 4, 5, 6] },
    C: { name: 'C', prateleiras: [0, 1, 2, 3, 4, 5, 6] },
    D: { name: 'D', prateleiras: [0, 1, 2, 3, 4, 5, 6] },
    E: { name: 'E', prateleiras: [0, 1, 2, 3, 4, 5, 6] },
    F: { name: 'F', prateleiras: [0, 1, 2, 3, 4, 5, 6] },
    G: { name: 'G', prateleiras: [0, 1, 2, 3, 4, 5, 6] },
    H: { name: 'H', prateleiras: [0, 1, 2, 3, 4, 5] },
  },
};