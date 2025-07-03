import { Product, Material, Movement } from '@/types/warehouse';

export const mockProducts: Product[] = [
  {
    id: '1',
    familia: 'Aluminios',
    modelo: 'Remate L 35x48',
    acabamento: 'Anodizado',
    cor: 'Prata',
    comprimento: 2000,
  },
  {
    id: '2',
    familia: 'Aluminios',
    modelo: 'Remate L 35x48',
    acabamento: 'Anodizado',
    cor: 'Preto',
    comprimento: 2000,
  },
  {
    id: '3',
    familia: 'Classicos',
    modelo: 'ZoomDeck',
    acabamento: 'Lixado',
    cor: 'Antracite',
    comprimento: 3000,
  },
];

export const mockMaterials: Material[] = [
  {
    id: 'm1',
    productId: '1',
    product: mockProducts[0],
    pecas: 25,
    location: { estante: 'B', prateleira: 2 },
  },
  {
    id: 'm2',
    productId: '2',
    product: mockProducts[1],
    pecas: 8,
    location: { estante: 'C', prateleira: 1 },
  },
  {
    id: 'm3',
    productId: '3',
    product: mockProducts[2],
    pecas: 45,
    location: { estante: 'D', prateleira: 3 },
  },
  {
    id: 'm4',
    productId: '1',
    product: mockProducts[0],
    pecas: 3,
    location: { estante: 'F', prateleira: 1 },
  },
];

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