import React, { useMemo } from 'react';
import { Product } from '@/types/warehouse';
import { SelectWithSearch } from '@/components/ui/select-with-search';
import { Button } from '@/components/ui/button';
import { X, Loader2 } from 'lucide-react';
import { ApiAttribute } from '@/services/attributesApiService';
import { ExclusionsDialog } from './ExclusionsDialog';

interface EPWFiltersProps {
  products: Product[];
  filters: {
    familia: string;
    modelo: string;
    comprimento: string;
    cor: string;
    acabamento: string;
  };
  onFilterChange: (field: string, value: string) => void;
  // API attributes for filters
  apiModelos?: ApiAttribute[];
  apiAcabamentos?: ApiAttribute[];
  apiComprimentos?: ApiAttribute[];
  apiCores?: ApiAttribute[];
  modelosLoading?: boolean;
  acabamentosLoading?: boolean;
  comprimentosLoading?: boolean;
  coresLoading?: boolean;
  modelosError?: string | null;
  acabamentosError?: string | null;
  comprimentosError?: string | null;
  coresError?: string | null;
  // Exclusions count for display
  excludedCount?: number;
}

export const EPWFilters: React.FC<EPWFiltersProps> = ({
  products,
  filters,
  onFilterChange,
  apiModelos = [],
  apiAcabamentos = [],
  apiComprimentos = [],
  apiCores = [],
  modelosLoading = false,
  acabamentosLoading = false,
  comprimentosLoading = false,
  coresLoading = false,
  modelosError = null,
  acabamentosError = null,
  comprimentosError = null,
  coresError = null,
  excludedCount = 0,
}) => {
  // Extract unique values for each EPW field from available products
  const filterOptions = useMemo(() => {
    const options = {
      comprimento: new Set<string>(),
      cor: new Set<string>(),
      acabamento: new Set<string>(),
    };

    products.forEach(product => {
      if (product.epwComprimento?.l) options.comprimento.add(`${product.epwComprimento.l} - ${product.epwComprimento.d}`);
      if (product.epwCor?.l) options.cor.add(`${product.epwCor.l} - ${product.epwCor.d}`);
      if (product.epwAcabamento?.l) options.acabamento.add(`${product.epwAcabamento.l} - ${product.epwAcabamento.d}`);
    });

    return {
      comprimento: Array.from(options.comprimento).sort(),
      cor: Array.from(options.cor).sort(),
      acabamento: Array.from(options.acabamento).sort(),
    };
  }, [products]);

  // Modelo options from API (with fallback to products)
  const modeloOptions = useMemo(() => {
    console.log('🔍 [EPWFilters] API Modelos count:', apiModelos?.length, 'Sample:', apiModelos?.slice(0, 2));
    if (apiModelos && apiModelos.length > 0) {
      // Use API data - return objects for easy mapping
      return apiModelos;
    }
    
    // Fallback to products data - convert to same format
    const productModelos = new Map<string, string>();
    products.forEach(product => {
      if (product.epwModelo?.l) {
        productModelos.set(product.epwModelo.l, product.epwModelo.d);
      }
    });
    
    const fallbackModelos = Array.from(productModelos.entries())
      .map(([l, d]) => ({ l, d }))
      .sort((a, b) => a.d.localeCompare(b.d));
    console.log('📦 [EPWFilters] Fallback Modelos count:', fallbackModelos.length, 'Sample:', fallbackModelos.slice(0, 2));
    return fallbackModelos;
  }, [apiModelos, products]);

  // Acabamento options from API (with fallback to products)
  const acabamentoOptions = useMemo(() => {
    if (apiAcabamentos.length > 0) {
      // Use API data - return objects for easy mapping
      return apiAcabamentos;
    }
    
    // Fallback to products data - convert to same format
    const productAcabamentos = new Map<string, string>();
    products.forEach(product => {
      if (product.epwAcabamento?.l) {
        productAcabamentos.set(product.epwAcabamento.l, product.epwAcabamento.d);
      }
    });
    
    return Array.from(productAcabamentos.entries())
      .map(([l, d]) => ({ l, d }))
      .sort((a, b) => a.d.localeCompare(b.d));
  }, [apiAcabamentos, products]);

  // Comprimento options from API (with fallback to products)
  const comprimentoOptions = useMemo(() => {
    if (apiComprimentos.length > 0) {
      // Use API data - return objects for easy mapping
      return apiComprimentos;
    }
    
    // Fallback to products data - convert to same format
    const productComprimentos = new Map<string, string>();
    products.forEach(product => {
      if (product.epwComprimento?.l) {
        productComprimentos.set(product.epwComprimento.l, product.epwComprimento.d);
      }
    });
    
    return Array.from(productComprimentos.entries())
      .map(([l, d]) => ({ l, d }))
      .sort((a, b) => a.d.localeCompare(b.d));
  }, [apiComprimentos, products]);

  // Cor options from API (with fallback to products)
  const corOptions = useMemo(() => {
    if (apiCores.length > 0) {
      // Use API data - return objects for easy mapping
      return apiCores;
    }
    
    // Fallback to products data - convert to same format
    const productCores = new Map<string, string>();
    products.forEach(product => {
      if (product.epwCor?.l) {
        productCores.set(product.epwCor.l, product.epwCor.d);
      }
    });
    
    return Array.from(productCores.entries())
      .map(([l, d]) => ({ l, d }))
      .sort((a, b) => a.d.localeCompare(b.d));
  }, [apiCores, products]);

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
                  onFilterChange('familia', 'all');
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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Familia Filter */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block flex items-center gap-2">
            Família
          </label>
          <SelectWithSearch
            options={[]} // Familia será determinada pelos códigos EPW reais
            value={filters.familia}
            onValueChange={(value) => onFilterChange('familia', value)}
            placeholder="Todas as famílias"
            searchPlaceholder="Pesquisar famílias..."
            className="bg-card border-border text-white"
          />
        </div>

        {/* Modelo Filter */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block flex items-center gap-2">
            Modelo
            {modelosLoading && <Loader2 className="w-3 h-3 animate-spin" />}
            {modelosError && <span className="text-red-400 text-xs">(API erro)</span>}
          </label>
          <SelectWithSearch
            options={modeloOptions}
            value={filters.modelo}
            onValueChange={(value) => onFilterChange('modelo', value)}
            placeholder="Todos os modelos"
            searchPlaceholder="Pesquisar modelos..."
            loading={modelosLoading}
            error={modelosError}
            className="bg-card border-border text-white"
          />
        </div>

        {/* Comprimento Filter */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block flex items-center gap-2">
            Comprimento
            {comprimentosLoading && <Loader2 className="w-3 h-3 animate-spin" />}
            {comprimentosError && <span className="text-red-400 text-xs">(API erro)</span>}
          </label>
          <SelectWithSearch
            options={comprimentoOptions}
            value={filters.comprimento}
            onValueChange={(value) => onFilterChange('comprimento', value)}
            placeholder="Todos comprimentos"
            searchPlaceholder="Pesquisar comprimentos..."
            loading={comprimentosLoading}
            error={comprimentosError}
            className="bg-card border-border text-white"
          />
        </div>

        {/* Cor Filter */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block flex items-center gap-2">
            Cor
            {coresLoading && <Loader2 className="w-3 h-3 animate-spin" />}
            {coresError && <span className="text-red-400 text-xs">(API erro)</span>}
          </label>
          <SelectWithSearch
            options={corOptions}
            value={filters.cor}
            onValueChange={(value) => onFilterChange('cor', value)}
            placeholder="Todas as cores"
            searchPlaceholder="Pesquisar cores..."
            loading={coresLoading}
            error={coresError}
            className="bg-card border-border text-white"
          />
        </div>

        {/* Acabamento Filter */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block flex items-center gap-2">
            Acabamento
            {acabamentosLoading && <Loader2 className="w-3 h-3 animate-spin" />}
            {acabamentosError && <span className="text-red-400 text-xs">(API erro)</span>}
          </label>
          <SelectWithSearch
            options={acabamentoOptions}
            value={filters.acabamento}
            onValueChange={(value) => onFilterChange('acabamento', value)}
            placeholder="Todos acabamentos"
            searchPlaceholder="Pesquisar acabamentos..."
            loading={acabamentosLoading}
            error={acabamentosError}
            className="bg-card border-border text-white"
          />
        </div>
      </div>
    </div>
  );
};