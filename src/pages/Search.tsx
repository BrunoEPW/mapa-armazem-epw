import React from 'react';
import { useNavigate } from 'react-router-dom';
import SearchPanel from '@/components/warehouse/SearchPanel';
import searchBanner from '@/assets/search-banner.jpg';

const Search = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-warehouse-bg p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/')}
            className="relative w-full max-w-2xl transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-lg"
          >
            <img 
              src={searchBanner} 
              alt="Search Banner" 
              className="w-full h-32 sm:h-40 object-cover rounded-lg shadow-lg"
            />
            <div className="absolute inset-0 flex items-center justify-between bg-black/30 rounded-lg px-4 sm:px-6">
              <img 
                src="/lovable-uploads/ce6ad3d6-6728-414c-b327-428c5cd38f81.png" 
                alt="EPW Logo - Voltar para página inicial" 
                className="h-12 sm:h-16 lg:h-20 drop-shadow-lg"
              />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-wider drop-shadow-lg">
                PESQUISA
              </h1>
            </div>
          </button>
        </div>

        <SearchPanel />
      </div>
    </div>
  );
};

export default Search;