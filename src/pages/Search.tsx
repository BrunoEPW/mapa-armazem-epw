import React from 'react';
import { useNavigate } from 'react-router-dom';
import SearchPanel from '@/components/warehouse/SearchPanel';
import { DebugPanel } from '@/components/ui/DebugPanel';
import Footer from '@/components/ui/Footer';
import searchBanner from '@/assets/search-banner.jpg';

const Search = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-warehouse-bg p-4 sm:p-6 lg:p-8 flex flex-col">
      <div className="max-w-6xl mx-auto flex-1">
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/')}
            className="relative w-full max-w-2xl transition-all duration-500 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-lg animate-fade-in"
          >
            <img 
              src={searchBanner} 
              alt="Search Banner" 
              className="w-full h-32 sm:h-40 object-cover rounded-lg shadow-lg transition-all duration-300"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-wider drop-shadow-lg">
                PESQUISA
              </h1>
            </div>
          </button>
        </div>

        <SearchPanel />
      </div>

      <DebugPanel additionalInfo={{ page: 'search' }} />

      <Footer />
    </div>
  );
};

export default Search;