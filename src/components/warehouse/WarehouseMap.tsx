import React from 'react';
import { useNavigate } from 'react-router-dom';
import { WAREHOUSE_CONFIG } from '@/types/warehouse';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { cn } from '@/lib/utils';

const WarehouseMap: React.FC = () => {
  const navigate = useNavigate();
  const { materials, selectedShelf } = useWarehouse();

  const getShelfStatus = (estante: string) => {
    const shelfMaterials = materials.filter(m => m.location.estante === estante);
    
    if (shelfMaterials.length === 0) return 'empty';
    
    const totalPecas = shelfMaterials.reduce((sum, m) => sum + m.pecas, 0);
    
    if (totalPecas < 10) return 'low';
    return 'stock';
  };

  const getShelfClassName = (estante: string) => {
    const status = getShelfStatus(estante);
    const isSelected = selectedShelf?.estante === estante;
    const isHighShelf = ['A', 'H'].includes(estante);
    
    return cn(
      'relative rounded-lg transition-all duration-300 cursor-pointer text-xl font-bold text-black flex items-center justify-center transform hover:scale-105',
      isHighShelf ? 'h-40' : 'h-32',
      'bg-warehouse-shelf-yellow border-4 border-warehouse-shelf-base',
      {
        'after:absolute after:inset-2 after:rounded after:bg-warehouse-shelf-empty': status === 'empty',
        'after:absolute after:inset-2 after:rounded after:bg-warehouse-shelf-low': status === 'low',
        'after:absolute after:inset-2 after:rounded after:bg-warehouse-shelf-stock': status === 'stock',
        'after:absolute after:inset-2 after:rounded after:bg-warehouse-shelf-selected': isSelected,
      }
    );
  };

  const handleShelfClick = (estante: string) => {
    navigate(`/estante/${estante}`);
  };

  const renderShelfGroup = (estantes: string[], withSeparator = false) => (
    <div className="flex items-center gap-2">
      {estantes.map((estante, index) => (
        <React.Fragment key={estante}>
          <div
            className={getShelfClassName(estante)}
            onClick={() => handleShelfClick(estante)}
            style={{ width: '120px' }}
          >
            <span className="relative z-10">{estante}</span>
          </div>
          {withSeparator && index === 0 && (
            <div className="w-2 h-32 bg-warehouse-shelf-separator rounded"></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-warehouse-bg p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          Mapa do Armazém
        </h1>
        
        {/* Layout específico das estantes */}
        <div className="flex justify-center items-center gap-8 mb-8">
          {/* Estante A - Isolada à esquerda */}
          {renderShelfGroup(['A'])}
          
          {/* Grupo B-C */}
          {renderShelfGroup(['B', 'C'], true)}
          
          {/* Grupo D-E */}
          {renderShelfGroup(['D', 'E'], true)}
          
          {/* Grupo F-G */}
          {renderShelfGroup(['F', 'G'], true)}
          
          {/* Estante H - Isolada à direita */}
          {renderShelfGroup(['H'])}
        </div>

        {/* Legenda */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-white">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-warehouse-shelf-stock rounded"></div>
            <span>Com Stock</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-warehouse-shelf-low rounded"></div>
            <span>Stock Baixo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-warehouse-shelf-empty rounded"></div>
            <span>Vazio</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-warehouse-shelf-selected rounded"></div>
            <span>Selecionado</span>
          </div>
        </div>

        {/* Legenda da estrutura */}
        <div className="mt-8 text-center text-gray-400">
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-warehouse-shelf-yellow rounded"></div>
              <span>Estante</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-warehouse-shelf-base rounded"></div>
              <span>Base</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-warehouse-shelf-separator rounded"></div>
              <span>Separador</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarehouseMap;