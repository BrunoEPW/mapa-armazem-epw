// Product catalog data for warehouse management

export const FAMILIAS = [
  'Classicos',
  'Titanium', 
  'Acessórios',
  'Aluminios',
  'Navigator'
];

export const MODELOS_POR_FAMILIA = {
  'Classicos': [
    'ZoomDeck',
    'EpDeck', 
    'LcDeck',
    'HavDeck',
    'LcDeck Classic',
    'LX120 Flat',
    'XXL183 Flat',
    'XXL183 Ribbed',
    'LX120 Ribbed',
    'EzWall',
    'HavDeck Solid',
    'XL138 Ribbed',
    'XL138 Flat',
    'TuDeck'
  ],
  'Titanium': [
    'Titanium Deck Flat',
    'Titanium Deck Ribbed',
    'Remate Titanium Flat',
    'Castellion',
    'Remate Titanium Ribbed',
    'Titanium Deck HD',
    'EzWall Titanium',
    'Vedacao Titanium'
  ],
  'Acessórios': [
    'WPC Fascia',
    'Sarrafo Compósito',
    'Queixo de Escada LcDeck',
    'Queixo de Escada EpDeck',
    'Queixo de Escada HavDeck',
    'Queixo de Escada ZoomDeck',
    'Clip de Inicio Inox 37x9mm (25un)',
    'EzClean - WPC Cleaning Agent',
    'Cunha Plastica 100x30',
    'EzLock',
    'Parafuso Inox A2 (250un)',
    'Sarrafo Madeira',
    'EzClip',
    'Pedestal',
    'Clip XXL',
    'Sarrafo PVC',
    'EzClip Deck e Deck',
    'Clip Navigator',
    'Canto PVC 55x55x2mm'
  ],
  'Aluminios': [
    'Travessa aluminio 50x50',
    'Remate Exterior de Canto 35x35',
    'Remate Lateral 35x25mm',
    'Perfil Inicio EzWall 35x8mm',
    'Base para Remate de Canto Castellation',
    'Exterior para Remate de Canto Castellation',
    'Base para Remate de Canto EzWall',
    'Exterior para Remate de Canto EzWall',
    'Remate L 35x48',
    'Remate L 35x90',
    'Remate L 35x150',
    'Travessa Aluminio 50x30',
    'Remate Exterior de Canto EzWall Titanium',
    'Remate Exterior de Canto Castellation'
  ],
  'Navigator': [
    'Navigator Flat WG',
    'Navigator Ribbed',
    'Navigator Flat WG - Remate',
    'Navigator Ribbed - Remate',
    'Navigator Wall WG',
    'Navigator Castellation',
    'Navigator Fascia'
  ]
};

export const MODELOS = Object.values(MODELOS_POR_FAMILIA).flat();

export const ACABAMENTOS = [
  'Lixado',
  'Lixado + Gravado Wood Grain',
  'Tynex',
  'Escovado',
  'Sem',
  'SG',
  'TT',
  'WG',
];

export const CORES = [
  'Antracite',
  'Vulcan',
  'Chocolate',
  'Mid Brown',
  'Bronze',
  'Golden Brown',
  'Faia / Oak',
  'Latte',
  'Gold8',
  'Camel',
  'Natural',
  'Grey',
  'Green',
  'Artic Ice',
  'Cumaru',
  'Sucupira',
  'Teka',
  'Light Carbonized',
  'Rustik Grey',
  'RoseWood',
  'Silver',
  'Perola',
  'IPE',
  'Antique',
  'Latte',
  'White',
];

export const COMPRIMENTOS = [
  '1500',
  '2300',
  '3200',
  '3600',
  'metro linear',
  '3000',
  '2250',
  '2500',
];