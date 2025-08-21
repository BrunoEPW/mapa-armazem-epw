import React from 'react';
import { SelectWithSearch } from '@/components/ui/select-with-search';
import { Button } from '@/components/ui/button';
import { X, Loader2 } from 'lucide-react';
import { useApiAttributes } from '@/hooks/useApiAttributes';

import { ExclusionsDialog } from './ExclusionsDialog';

interface EPWFiltersProps {
  filters: {
    modelo: string;
    comprimento: string;
    cor: string;
    acabamento: string;
  };
  onFilterChange: (field: string, value: string) => void;
  // Exclusions count for display
  excludedCount?: number;
}

export const EPWFilters: React.FC<EPWFiltersProps> = ({
  filters,
  onFilterChange,
  excludedCount = 0,
}) => {
  // Use API attributes instead of extracting from products
  const {
    modelos,
    comprimentos,
    cores,
    acabamentos,
    modelosLoading,
    comprimentosLoading,
    coresLoading,
    acabamentosLoading,
    modelosError,
    comprimentosError,
    coresError,
    acabamentosError
  } = useApiAttributes();


  const hasActiveFilters = Object.values(filters).some(filter => filter !== 'all');

  return (
    <div className="bg-card/20 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium">Filtros EPW</h3>
        <div className="flex items-center gap-2">
          <ExclusionsDialog excludedCount={excludedCount} />
          {hasActiveFilters && (
              <Button
                onClick={() => {
                  onFilterChange('modelo', 'all');
                  onFilterChange('comprimento', 'all');
                  onFilterChange('cor', 'all');
                  onFilterChange('acabamento', 'all');
                }}
                variant="outline"
                size="sm"
                className="text-white border-white hover:bg-white hover:text-black"
              >
              <X className="w-4 h-4 mr-1" />
              Limpar Filtros
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Modelo Filter */}
        <div>
          <label className="text-white text-sm font-medium mb-2 flex items-center gap-2">
            Modelo
            {modelosLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          </label>
          <SelectWithSearch
            options={modelos}
            value={filters.modelo}
            onValueChange={(value) => onFilterChange('modelo', value)}
            placeholder={modelosError ? "Erro ao carregar" : "Todos os modelos"}
            searchPlaceholder="Pesquisar modelos..."
            className="bg-card border-border text-white"
            disabled={modelosLoading || !!modelosError}
          />
        </div>

        {/* Comprimento Filter */}
        <div>
          <label className="text-white text-sm font-medium mb-2 flex items-center gap-2">
            Comprimento
            {comprimentosLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          </label>
          <SelectWithSearch
            options={comprimentos}
            value={filters.comprimento}
            onValueChange={(value) => onFilterChange('comprimento', value)}
            placeholder={comprimentosError ? "Erro ao carregar" : "Todos comprimentos"}
            searchPlaceholder="Pesquisar comprimentos..."
            className="bg-card border-border text-white"
            disabled={comprimentosLoading || !!comprimentosError}
          />
        </div>

        {/* Cor Filter */}
        <div>
          <label className="text-white text-sm font-medium mb-2 flex items-center gap-2">
            Cor
            {coresLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          </label>
          <SelectWithSearch
            options={cores}
            value={filters.cor}
            onValueChange={(value) => onFilterChange('cor', value)}
            placeholder={coresError ? "Erro ao carregar" : "Todas as cores"}
            searchPlaceholder="Pesquisar cores..."
            className="bg-card border-border text-white"
            disabled={coresLoading || !!coresError}
          />
        </div>

        {/* Acabamento Filter */}
        <div>
          <label className="text-white text-sm font-medium mb-2 flex items-center gap-2">
            Acabamento
            {acabamentosLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          </label>
          <SelectWithSearch
            options={acabamentos}
            value={filters.acabamento}
            onValueChange={(value) => onFilterChange('acabamento', value)}
            placeholder={acabamentosError ? "Erro ao carregar" : "Todos acabamentos"}
            searchPlaceholder="Pesquisar acabamentos..."
            className="bg-card border-border text-white"
            disabled={acabamentosLoading || !!acabamentosError}
          />
        </div>
      </div>
    </div>
  );
};