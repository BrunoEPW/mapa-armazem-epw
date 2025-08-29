import { Product, Material, Movement } from '@/types/warehouse';

export const mockProducts: Product[] = [];

export const mockMaterials: Material[] = [];

export const mockMovements: Movement[] = [
  {
    id: 'mov1',
    materialId: 'm1',
    type: 'entrada',
    pecas: 30,
    norc: 'NORC001',
    date: '2024-01-15',
  },
  {
    id: 'mov2',
    materialId: 'm1',
    type: 'saida',
    pecas: 5,
    norc: 'NORC002',
    date: '2024-01-20',
  },
];