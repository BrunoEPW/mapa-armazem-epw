
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WAREHOUSE_CONFIG } from '@/types/warehouse';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { cn } from '@/lib/utils';

const ShelfView: React.FC = () => {
  const navigate = useNavigate();
  const { estante } = useParams<{ estante: string }>();
  const { materials, setSelectedShelf } = useWarehouse();

  if (!estante || !WAREHOUSE_CONFIG.estantes[estante]) {
    navigate('/');
    return null;
  }

  const currentShelf = WAREHOUSE_CONFIG.estantes[estante];
  const estanteKeys = Object.keys(WAREHOUSE_CONFIG.estantes);
  const currentIndex = estanteKeys.indexOf(estante);
  
  const getPrevShelf = () => {
    if (currentIndex > 0) return estanteKeys[currentIndex - 1];
    return null;
  };

  const getNextShelf = () => {
    if (currentIndex < estanteKeys.length - 1) return estanteKeys[currentIndex + 1];
    return null;
  };

  const getShelfStatus = (prateleira: number) => {
    const shelfMaterials = materials.filter(
      m => m.location.estante === estante && m.location.prateleira === prateleira
    );
    
    if (shelfMaterials.length === 0) return 'empty';
    return 'with-products';
  };

  const getShelfClassName = (prateleira: number) => {
    const status = getShelfStatus(prateleira);
    
    const baseClasses = 'h-16 flex items-center justify-center transition-all duration-300 cursor-pointer text-lg font-bold text-white hover:scale-105 hover:shadow-lg transform border-2 rounded-lg';
    
    return cn(baseClasses, {
      'bg-green-600 border-green-600': status === 'empty',
      'bg-orange-600 border-orange-600': status === 'with-products',
    });
  };

  const handleShelfClick = (prateleira: number) => {
    setSelectedShelf({ estante, prateleira });
    navigate(`/prateleira/${estante}/${prateleira}`);
  };

  return (
    <div className="min-h-screen bg-warehouse-bg p-8" style={{ backgroundColor: 'hsl(220 20% 6%)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Mapa Principal
          </Button>
          
          <h1 className="text-3xl font-bold text-foreground">
            Estante {estante}
          </h1>
          
          <div className="flex gap-2">
            {getPrevShelf() && (
              <Button
                variant="outline"
                onClick={() => navigate(`/estante/${getPrevShelf()}`)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {getPrevShelf()}
              </Button>
            )}
            {getNextShelf() && (
              <Button
                variant="outline"
                onClick={() => navigate(`/estante/${getNextShelf()}`)}
                className="flex items-center gap-2"
              >
                {getNextShelf()}
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {[...currentShelf.prateleiras].reverse().map((prateleira) => (
            <div
              key={prateleira}
              className={getShelfClassName(prateleira)}
              onClick={() => handleShelfClick(prateleira)}
            >
              <span className="text-xl font-bold">Prateleira {prateleira}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center text-muted-foreground">
          <p>Clique numa prateleira para ver o conteúdo</p>
        </div>
      </div>
    </div>
  );
};

export default ShelfView;
