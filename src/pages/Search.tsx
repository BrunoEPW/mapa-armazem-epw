import React from 'react';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import SearchPanel from '@/components/warehouse/SearchPanel';
import EPWLogo from '@/components/ui/epw-logo';

const Search = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-warehouse-bg p-4 sm:p-6 lg:p-8 relative">
      {/* Logo marca d'água no canto superior esquerdo */}
      <div className="fixed top-4 left-4 z-10 opacity-50">
        <img 
          src="/lovable-uploads/ce6ad3d6-6728-414c-b327-428c5cd38f81.png" 
          alt="EPW Logo" 
          className="h-8 sm:h-10"
        />
      </div>
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
            <EPWLogo size="medium" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Pesquisa de Materiais
            </h1>
          </div>
          
          <div className="hidden sm:block order-3"></div>
        </div>

        <SearchPanel />
      </div>
    </div>
  );
};

export default Search;