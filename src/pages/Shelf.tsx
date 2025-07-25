import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ShelfView from '@/components/warehouse/ShelfView';
import shelvesBanner from '@/assets/shelves-banner.jpg';

const Shelf = () => {
  const { estante } = useParams<{ estante: string }>();
  const navigate = useNavigate();

  const estantes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const currentIndex = estantes.indexOf(estante || '');
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < estantes.length - 1;

  return (
    <div className="min-h-screen bg-warehouse-bg p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/')}
            className="relative w-full max-w-2xl transition-all duration-500 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-lg mb-4 animate-fade-in"
          >
            <img 
              src={shelvesBanner} 
              alt="Shelves Banner" 
              className="w-full h-32 sm:h-40 object-cover rounded-lg shadow-lg transition-all duration-300"
            />
            <div className="absolute inset-0 flex items-center justify-between bg-black/30 rounded-lg pl-2 pr-4 sm:pr-6">
              <img 
                src="/lovable-uploads/ce6ad3d6-6728-414c-b327-428c5cd38f81.png" 
                alt="EPW Logo - Voltar para página inicial" 
                className="h-32 sm:h-40"
              />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-wider drop-shadow-lg">
                ESTANTE {estante}
              </h1>
            </div>
          </button>
          
          <div className="flex gap-2 mt-4">
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