import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SearchPanel from '@/components/warehouse/SearchPanel';
import { ProductCodeVerifier } from '@/components/warehouse/ProductCodeVerifier';
import Footer from '@/components/ui/Footer';
import searchBanner from '@/assets/search-banner.jpg';

const Search = () => {
  const navigate = useNavigate();
  const [showVerifier, setShowVerifier] = useState(false);

  return (
    <div className="min-h-screen bg-warehouse-bg p-4 sm:p-6 lg:p-8 flex flex-col w-full">
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
            className="relative w-full transition-all duration-500 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-lg animate-fade-in"
          >
            <img 
              src={searchBanner} 
              alt="Search Banner" 
              className="w-full h-32 sm:h-40 object-cover rounded-lg shadow-lg transition-all duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/80 rounded-lg flex items-center justify-center">
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-black text-orange-400 tracking-wider drop-shadow-2xl">
                PESQUISA
              </h1>
            </div>
          </button>
        </div>

        <div className="max-w-7xl mx-auto">
          <SearchPanel />
          
          <div className="mt-6">
            <ProductCodeVerifier 
              show={showVerifier} 
              onToggle={() => setShowVerifier(!showVerifier)} 
            />
          </div>
        </div>
      </div>


      <Footer />
    </div>
  );
};

export default Search;