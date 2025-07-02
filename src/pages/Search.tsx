import React from 'react';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import SearchPanel from '@/components/warehouse/SearchPanel';

const Search = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-warehouse-bg p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white border-white hover:bg-white hover:text-black"
          >
            <Home className="w-4 h-4" />
            Home
          </Button>
          
          <h1 className="text-3xl font-bold text-white">
            Pesquisa de Materiais
          </h1>
          
          <div></div>
        </div>

        <SearchPanel />
      </div>
    </div>
  );
};

export default Search;