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
    
    return cn(
      'h-32 flex items-center justify-center rounded-lg border-2 transition-all duration-300 cursor-pointer text-xl font-bold',
      'hover:scale-105 hover:shadow-lg transform text-white',
      {
        'bg-warehouse-shelf-empty border-warehouse-shelf-empty': status === 'empty',
        'bg-warehouse-shelf-low border-warehouse-shelf-low': status === 'low',
        'bg-warehouse-shelf-stock border-warehouse-shelf-stock': status === 'stock',
        'bg-warehouse-shelf-selected border-warehouse-shelf-selected': isSelected,
        'hover:bg-warehouse-shelf-hover': !isSelected,
      }
    );
  };

  const handleShelfClick = (estante: string) => {
    navigate(`/estante/${estante}`);
  };

  return (
    <div className="min-h-screen bg-warehouse-bg p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8 text-center">
          Mapa do Armazém
        </h1>
        
        <div className="grid grid-cols-8 gap-4 mb-8">
          {Object.keys(WAREHOUSE_CONFIG.estantes).map((estante) => (
            <div
              key={estante}
              className={getShelfClassName(estante)}
              onClick={() => handleShelfClick(estante)}
            >
              {estante}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
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
      </div>
    </div>
  );
};

export default WarehouseMap;