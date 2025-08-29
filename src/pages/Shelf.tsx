import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ShelfView from '@/components/warehouse/ShelfView';
import Footer from '@/components/ui/Footer';
import shelvesBanner from '@/assets/shelves-banner.jpg';

const Shelf = () => {
  const { estante } = useParams<{ estante: string }>();
  const navigate = useNavigate();

  const estantes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const currentIndex = estantes.indexOf(estante || '');
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < estantes.length - 1;

  return (
    <div className="min-h-screen bg-warehouse-bg p-4 sm:p-6 lg:p-8 flex flex-col">
      <div className="w-full flex-1">
        {/* Back Button */}
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white hover:text-orange-400 transition-colors duration-200 p-2 rounded-lg hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Voltar</span>
          </button>
        </div>
        
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/')}
            className="relative w-full transition-all duration-500 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-lg mb-4 animate-fade-in"
          >
            <img 
              src={shelvesBanner} 
              alt="Shelves Banner" 
              className="w-full h-32 sm:h-40 object-cover rounded-lg shadow-lg transition-all duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/80 rounded-lg flex items-center justify-center">
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-black text-orange-400 tracking-wider drop-shadow-2xl">
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


      <Footer />
    </div>
  );
};

export default Shelf;