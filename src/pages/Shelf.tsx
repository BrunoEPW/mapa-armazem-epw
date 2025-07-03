import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ShelfView from '@/components/warehouse/ShelfView';
import EPWLogo from '@/components/ui/epw-logo';

const Shelf = () => {
  const { estante } = useParams<{ estante: string }>();
  const navigate = useNavigate();

  const estantes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const currentIndex = estantes.indexOf(estante || '');
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < estantes.length - 1;

  return (
    <div className="min-h-screen bg-warehouse-bg p-4 sm:p-6 lg:p-8" style={{ backgroundColor: 'hsl(220 20% 6%)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white border-white hover:bg-white hover:text-black order-2 sm:order-1"
          >
            <Home className="w-4 h-4" />
            Home
          </Button>
          
          <div className="flex items-center gap-4 order-1 sm:order-2">
            <img 
              src="/lovable-uploads/ce6ad3d6-6728-414c-b327-428c5cd38f81.png" 
              alt="EPW Logo" 
              className="h-8 sm:h-10"
            />
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Estante {estante}
            </h1>
          </div>
          
          <div className="flex gap-2 order-3">
            {canGoPrevious && (
              <Button
                variant="outline"
                onClick={() => navigate(`/estante/${estantes[currentIndex - 1]}`)}
                className="flex items-center gap-2 text-white border-white hover:bg-white hover:text-black"
              >
                <ChevronLeft className="w-4 h-4" />
                {estantes[currentIndex - 1]}
              </Button>
            )}
            {canGoNext && (
              <Button
                variant="outline"
                onClick={() => navigate(`/estante/${estantes[currentIndex + 1]}`)}
                className="flex items-center gap-2 text-white border-white hover:bg-white hover:text-black"
              >
                {estantes[currentIndex + 1]}
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <ShelfView />
      </div>
    </div>
  );
};

export default Shelf;