import React, { useMemo } from 'react';
import { Product } from '@/types/warehouse';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface EPWFiltersProps {
  products: Product[];
  filters: {
    tipo: string;
    certificacao: string;
    modelo: string;
    comprimento: string;
    cor: string;
    acabamento: string;
  };
  onFilterChange: (field: string, value: string) => void;
}

export const EPWFilters: React.FC<EPWFiltersProps> = ({
  products,
  filters,
  onFilterChange,
}) => {
  // Extract unique values for each EPW field from available products
  const filterOptions = useMemo(() => {
    const options = {
      tipo: new Set<string>(),
      certificacao: new Set<string>(),
      modelo: new Set<string>(),
      comprimento: new Set<string>(),
      cor: new Set<string>(),
      acabamento: new Set<string>(),
    };

    products.forEach(product => {
      if (product.epwTipo?.l) options.tipo.add(`${product.epwTipo.l} - ${product.epwTipo.d}`);
      if (product.epwCertificacao?.l) options.certificacao.add(`${product.epwCertificacao.l} - ${product.epwCertificacao.d}`);
      if (product.epwModelo?.l) options.modelo.add(`${product.epwModelo.l} - ${product.epwModelo.d}`);
      if (product.epwComprimento?.l) options.comprimento.add(`${product.epwComprimento.l} - ${product.epwComprimento.d}`);
      if (product.epwCor?.l) options.cor.add(`${product.epwCor.l} - ${product.epwCor.d}`);
      if (product.epwAcabamento?.l) options.acabamento.add(`${product.epwAcabamento.l} - ${product.epwAcabamento.d}`);
    });

    return {
      tipo: Array.from(options.tipo).sort(),
      certificacao: Array.from(options.certificacao).sort(),
      modelo: Array.from(options.modelo).sort(),
      comprimento: Array.from(options.comprimento).sort(),
      cor: Array.from(options.cor).sort(),
      acabamento: Array.from(options.acabamento).sort(),
    };
  }, [products]);

  const hasActiveFilters = Object.values(filters).some(filter => filter !== '');

  return (
    <div className="bg-card/20 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium">Filtros EPW</h3>
        {hasActiveFilters && (
          <Button
            onClick={() => {
              onFilterChange('tipo', '');
              onFilterChange('certificacao', '');
              onFilterChange('modelo', '');
              onFilterChange('comprimento', '');
              onFilterChange('cor', '');
              onFilterChange('acabamento', '');
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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Tipo Filter */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            Tipo
          </label>
          <Select
            value={filters.tipo}
            onValueChange={(value) => onFilterChange('tipo', value)}
          >
            <SelectTrigger className="bg-card border-border text-white">
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground z-50">
              {filterOptions.tipo.map((option) => (
                <SelectItem key={option} value={option.split(' - ')[0]}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Certificação Filter */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            Certificação
          </label>
          <Select
            value={filters.certificacao}
            onValueChange={(value) => onFilterChange('certificacao', value)}
          >
            <SelectTrigger className="bg-card border-border text-white">
              <SelectValue placeholder="Todas certificações" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground z-50">
              {filterOptions.certificacao.map((option) => (
                <SelectItem key={option} value={option.split(' - ')[0]}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Modelo Filter */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            Modelo
          </label>
          <Select
            value={filters.modelo}
            onValueChange={(value) => onFilterChange('modelo', value)}
          >
            <SelectTrigger className="bg-card border-border text-white">
              <SelectValue placeholder="Todos os modelos" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground z-50">
              {filterOptions.modelo.map((option) => (
                <SelectItem key={option} value={option.split(' - ')[0]}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Comprimento Filter */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            Comprimento
          </label>
          <Select
            value={filters.comprimento}
            onValueChange={(value) => onFilterChange('comprimento', value)}
          >
            <SelectTrigger className="bg-card border-border text-white">
              <SelectValue placeholder="Todos comprimentos" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground z-50">
              {filterOptions.comprimento.map((option) => (
                <SelectItem key={option} value={option.split(' - ')[0]}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cor Filter */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            Cor
          </label>
          <Select
            value={filters.cor}
            onValueChange={(value) => onFilterChange('cor', value)}
          >
            <SelectTrigger className="bg-card border-border text-white">
              <SelectValue placeholder="Todas as cores" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground z-50">
              {filterOptions.cor.map((option) => (
                <SelectItem key={option} value={option.split(' - ')[0]}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Acabamento Filter */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            Acabamento
          </label>
          <Select
            value={filters.acabamento}
            onValueChange={(value) => onFilterChange('acabamento', value)}
          >
            <SelectTrigger className="bg-card border-border text-white">
              <SelectValue placeholder="Todos acabamentos" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground z-50">
              {filterOptions.acabamento.map((option) => (
                <SelectItem key={option} value={option.split(' - ')[0]}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};