import React from 'react';
import { ArrowLeft } from 'lucide-react';
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
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Mapa
          </Button>
          
          <h1 className="text-3xl font-bold text-foreground">
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