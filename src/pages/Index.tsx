import React from 'react';
import { useNavigate } from 'react-router-dom';
import { WAREHOUSE_CONFIG } from '@/types/warehouse';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { cn } from '@/lib/utils';

const Index = () => {
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
    
    return cn(
      'relative bg-warehouse-shelf-yellow transition-all duration-300 cursor-pointer text-2xl font-bold text-black flex items-center justify-center transform hover:scale-105',
      'w-32 h-48',
      {
        'after:absolute after:inset-4 after:rounded after:bg-warehouse-shelf-empty': status === 'empty',
        'after:absolute after:inset-4 after:rounded after:bg-warehouse-shelf-low': status === 'low', 
        'after:absolute after:inset-4 after:rounded after:bg-warehouse-shelf-stock': status === 'stock',
        'after:absolute after:inset-4 after:rounded after:bg-warehouse-shelf-selected': isSelected,
      }
    );
  };

  const handleShelfClick = (estante: string) => {
    navigate(`/estante/${estante}`);
  };

  const renderSingleShelf = (estante: string) => (
    <div className="bg-warehouse-shelf-base p-2">
      <div
        key={estante}
        className={getShelfClassName(estante)}
        onClick={() => handleShelfClick(estante)}
      >
        <span className="relative z-10">{estante}</span>
      </div>
    </div>
  );

  const renderShelfGroup = (estantes: string[]) => (
    <div className="bg-warehouse-shelf-base p-2 flex gap-1">
      {estantes.map((estante, index) => (
        <React.Fragment key={estante}>
          <div
            className={getShelfClassName(estante)}
            onClick={() => handleShelfClick(estante)}
          >
            <span className="relative z-10">{estante}</span>
          </div>
          {index === 0 && estantes.length === 2 && (
            <div className="w-2 bg-warehouse-shelf-separator"></div>
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
        
        {/* Layout específico das estantes conforme imagem */}
        <div className="flex justify-center items-end gap-8 mb-8">
          {/* Estante A - Isolada à esquerda */}
          {renderSingleShelf('A')}
          
          {/* Grupo B-C */}
          {renderShelfGroup(['B', 'C'])}
          
          {/* Grupo D-E */}
          {renderShelfGroup(['D', 'E'])}
          
          {/* Grupo F-G */}
          {renderShelfGroup(['F', 'G'])}
          
          {/* Estante H - Isolada à direita */}
          {renderSingleShelf('H')}
        </div>
      </div>
    </div>
  );
};

export default Index;
