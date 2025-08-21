import React, { useMemo } from 'react';
import { Product } from '@/types/warehouse';
import { SelectWithSearch } from '@/components/ui/select-with-search';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

import { ExclusionsDialog } from './ExclusionsDialog';

interface EPWFiltersProps {
  products: Product[];
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
  products,
  filters,
  onFilterChange,
  excludedCount = 0,
}) => {
  // Extract unique values for each EPW field from available products
  const filterOptions = useMemo(() => {
    const options = {
      modelo: new Map<string, string>(),
      comprimento: new Map<string, string>(),
      cor: new Map<string, string>(),
      acabamento: new Map<string, string>(),
    };

    products.forEach(product => {
      if (product.epwModelo?.l) options.modelo.set(product.epwModelo.l, product.epwModelo.d);
      if (product.epwComprimento?.l) options.comprimento.set(product.epwComprimento.l, product.epwComprimento.d);
      if (product.epwCor?.l) options.cor.set(product.epwCor.l, product.epwCor.d);
      if (product.epwAcabamento?.l) options.acabamento.set(product.epwAcabamento.l, product.epwAcabamento.d);
    });

    return {
      modelo: Array.from(options.modelo.entries()).map(([l, d]) => ({ l, d })).sort((a, b) => a.d.localeCompare(b.d)),
      comprimento: Array.from(options.comprimento.entries()).map(([l, d]) => ({ l, d })).sort((a, b) => a.d.localeCompare(b.d)),
      cor: Array.from(options.cor.entries()).map(([l, d]) => ({ l, d })).sort((a, b) => a.d.localeCompare(b.d)),
      acabamento: Array.from(options.acabamento.entries()).map(([l, d]) => ({ l, d })).sort((a, b) => a.d.localeCompare(b.d)),
    };
  }, [products]);


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
          <label className="text-white text-sm font-medium mb-2 block">
            Modelo
          </label>
          <SelectWithSearch
            options={filterOptions.modelo}
            value={filters.modelo}
            onValueChange={(value) => onFilterChange('modelo', value)}
            placeholder="Todos os modelos"
            searchPlaceholder="Pesquisar modelos..."
            className="bg-card border-border text-white"
          />
        </div>

        {/* Comprimento Filter */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            Comprimento
          </label>
          <SelectWithSearch
            options={filterOptions.comprimento}
            value={filters.comprimento}
            onValueChange={(value) => onFilterChange('comprimento', value)}
            placeholder="Todos comprimentos"
            searchPlaceholder="Pesquisar comprimentos..."
            className="bg-card border-border text-white"
          />
        </div>

        {/* Cor Filter */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            Cor
          </label>
          <SelectWithSearch
            options={filterOptions.cor}
            value={filters.cor}
            onValueChange={(value) => onFilterChange('cor', value)}
            placeholder="Todas as cores"
            searchPlaceholder="Pesquisar cores..."
            className="bg-card border-border text-white"
          />
        </div>

        {/* Acabamento Filter */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            Acabamento
          </label>
          <SelectWithSearch
            options={filterOptions.acabamento}
            value={filters.acabamento}
            onValueChange={(value) => onFilterChange('acabamento', value)}
            placeholder="Todos acabamentos"
            searchPlaceholder="Pesquisar acabamentos..."
            className="bg-card border-border text-white"
          />
        </div>
      </div>
    </div>
  );
};