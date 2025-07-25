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
            className="transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-lg mb-4"
          >
            <img 
              src="/lovable-uploads/ce6ad3d6-6728-414c-b327-428c5cd38f81.png" 
              alt="EPW Logo - Voltar para página inicial" 
              className="h-16 sm:h-20 lg:h-24 drop-shadow-lg cursor-pointer"
            />
          </button>
          <div className="relative w-full max-w-2xl">
            <img 
              src={searchBanner} 
              alt="Search Banner" 
              className="w-full h-32 sm:h-40 object-cover rounded-lg shadow-lg"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-wider drop-shadow-lg">
                PESQUISA
              </h1>
            </div>
          </div>
        </div>

        <SearchPanel />
      </div>
    </div>
  );
};

export default Search;