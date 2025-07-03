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

  const getShelfStatus = (prateleira: number, posicao?: 'esquerda' | 'central' | 'direita') => {
    const shelfMaterials = materials.filter(
      m => m.location.estante === estante && 
           m.location.prateleira === prateleira &&
           (posicao ? m.location.posicao === posicao : m.location.posicao === 'central' || !m.location.posicao)
    );
    
    if (shelfMaterials.length === 0) return 'empty';
    
    const totalPecas = shelfMaterials.reduce((sum, m) => sum + m.pecas, 0);
    
    if (totalPecas < 10) return 'low';
    return 'stock';
  };

  const getShelfClassName = (prateleira: number, posicao?: 'esquerda' | 'central' | 'direita') => {
    const status = getShelfStatus(prateleira, posicao);
    
    const baseClasses = 'h-16 flex items-center justify-center transition-all duration-300 cursor-pointer text-lg font-bold text-white hover:scale-105 hover:shadow-lg transform border-2';
    
    if (posicao === 'esquerda') {
      return cn(baseClasses, {
        'bg-[hsl(var(--shelf-left-empty))] border-[hsl(var(--shelf-left-empty))]': status === 'empty',
        'bg-[hsl(var(--shelf-left-low))] border-[hsl(var(--shelf-left-low))]': status === 'low',
        'bg-[hsl(var(--shelf-left-stock))] border-[hsl(var(--shelf-left-stock))]': status === 'stock',
      });
    } else if (posicao === 'central') {
      return cn(baseClasses, {
        'bg-[hsl(var(--shelf-central-empty))] border-[hsl(var(--shelf-central-empty))]': status === 'empty',
        'bg-[hsl(var(--shelf-central-low))] border-[hsl(var(--shelf-central-low))]': status === 'low',
        'bg-[hsl(var(--shelf-central-stock))] border-[hsl(var(--shelf-central-stock))]': status === 'stock',
      });
    } else if (posicao === 'direita') {
      return cn(baseClasses, {
        'bg-[hsl(var(--shelf-right-empty))] border-[hsl(var(--shelf-right-empty))]': status === 'empty',
        'bg-[hsl(var(--shelf-right-low))] border-[hsl(var(--shelf-right-low))]': status === 'low',
        'bg-[hsl(var(--shelf-right-stock))] border-[hsl(var(--shelf-right-stock))]': status === 'stock',
      });
    }
    
    // Fallback to central position style if no position specified
    return cn(baseClasses, {
      'bg-[hsl(var(--shelf-central-empty))] border-[hsl(var(--shelf-central-empty))]': status === 'empty',
      'bg-[hsl(var(--shelf-central-low))] border-[hsl(var(--shelf-central-low))]': status === 'low',
      'bg-[hsl(var(--shelf-central-stock))] border-[hsl(var(--shelf-central-stock))]': status === 'stock',
    });
  };

  const handleShelfClick = (prateleira: number, posicao?: 'esquerda' | 'central' | 'direita') => {
    setSelectedShelf({ estante, prateleira, posicao });
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
            // Three-part view for all shelves
            <div key={prateleira} className="flex gap-1">
              <div
                className={cn(getShelfClassName(prateleira, 'esquerda'), 'rounded-l-lg rounded-r-none flex-1')}
                onClick={() => handleShelfClick(prateleira, 'esquerda')}
              >
                <span className="text-xl font-bold">P{prateleira} - E</span>
              </div>
              <div
                className={cn(getShelfClassName(prateleira, 'central'), 'rounded-none flex-1')}
                onClick={() => handleShelfClick(prateleira, 'central')}
              >
                <span className="text-xl font-bold">P{prateleira} - C</span>
              </div>
              <div
                className={cn(getShelfClassName(prateleira, 'direita'), 'rounded-r-lg rounded-l-none flex-1')}
                onClick={() => handleShelfClick(prateleira, 'direita')}
              >
                <span className="text-xl font-bold">P{prateleira} - D</span>
              </div>
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