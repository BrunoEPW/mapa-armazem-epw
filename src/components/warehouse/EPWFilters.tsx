import React, { useMemo } from 'react';
import { Product } from '@/types/warehouse';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, Loader2 } from 'lucide-react';
import { ApiAttribute } from '@/services/attributesApiService';
import { ExclusionsDialog } from './ExclusionsDialog';

interface EPWFiltersProps {
  products: Product[];
  filters: {
    tipo: string;
    modelo: string;
    comprimento: string;
    cor: string;
    acabamento: string;
  };
  onFilterChange: (field: string, value: string) => void;
  // API attributes for filters
  apiModelos?: ApiAttribute[];
  apiTipos?: ApiAttribute[];
  apiAcabamentos?: ApiAttribute[];
  apiComprimentos?: ApiAttribute[];
  apiCores?: ApiAttribute[];
  modelosLoading?: boolean;
  tiposLoading?: boolean;
  acabamentosLoading?: boolean;
  comprimentosLoading?: boolean;
  coresLoading?: boolean;
  modelosError?: string | null;
  tiposError?: string | null;
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
  apiTipos = [],
  apiAcabamentos = [],
  apiComprimentos = [],
  apiCores = [],
  modelosLoading = false,
  tiposLoading = false,
  acabamentosLoading = false,
  comprimentosLoading = false,
  coresLoading = false,
  modelosError = null,
  tiposError = null,
  acabamentosError = null,
  comprimentosError = null,
  coresError = null,
  excludedCount = 0,
}) => {
  // Extract unique values for each EPW field from available products
  const filterOptions = useMemo(() => {
    const options = {
      tipo: new Set<string>(),
      comprimento: new Set<string>(),
      cor: new Set<string>(),
      acabamento: new Set<string>(),
    };

    products.forEach(product => {
      if (product.epwTipo?.l) options.tipo.add(`${product.epwTipo.l} - ${product.epwTipo.d}`);
      if (product.epwComprimento?.l) options.comprimento.add(`${product.epwComprimento.l} - ${product.epwComprimento.d}`);
      if (product.epwCor?.l) options.cor.add(`${product.epwCor.l} - ${product.epwCor.d}`);
      if (product.epwAcabamento?.l) options.acabamento.add(`${product.epwAcabamento.l} - ${product.epwAcabamento.d}`);
    });

    return {
      tipo: Array.from(options.tipo).sort(),
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

  // Tipo options from API (with fallback to products)
  const tipoOptions = useMemo(() => {
    console.log('🔍 [EPWFilters] API Tipos count:', apiTipos?.length, 'Sample:', apiTipos?.slice(0, 2));
    if (apiTipos && apiTipos.length > 0) {
      // Use API data - return objects for easy mapping
      return apiTipos;
    }
    
    // Fallback to products data - convert to same format
    const productTipos = new Map<string, string>();
    products.forEach(product => {
      if (product.epwTipo?.l) {
        productTipos.set(product.epwTipo.l, product.epwTipo.d);
      }
    });
    
    const fallbackTipos = Array.from(productTipos.entries())
      .map(([l, d]) => ({ l, d }))
      .sort((a, b) => a.d.localeCompare(b.d));
    console.log('📦 [EPWFilters] Fallback Tipos count:', fallbackTipos.length, 'Sample:', fallbackTipos.slice(0, 2));
    return fallbackTipos;
  }, [apiTipos, products]);

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


  const hasActiveFilters = Object.values(filters).some(filter => filter !== '');

  return (
    <div className="bg-card/20 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium">Filtros EPW</h3>
        <div className="flex items-center gap-2">
          <ExclusionsDialog excludedCount={excludedCount} />
          {hasActiveFilters && (
              <Button
                onClick={() => {
                  onFilterChange('tipo', 'all');
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
        {/* Tipo Filter */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block flex items-center gap-2">
            Tipo
            {tiposLoading && <Loader2 className="w-3 h-3 animate-spin" />}
            {tiposError && <span className="text-red-400 text-xs">(API erro)</span>}
          </label>
          <Select
            value={filters.tipo}
            onValueChange={(value) => onFilterChange('tipo', value)}
          >
            <SelectTrigger className="bg-card border-border text-white">
              <SelectValue placeholder={
                tiposLoading ? "Carregando tipos da API..." :
                tiposError ? "Erro na API - usando dados locais" :
                "Todos os tipos"
              } />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground z-50">
              <SelectItem value="all">Todos os tipos</SelectItem>
              {tiposError && (
                <SelectItem value="api-error" disabled className="text-muted-foreground">
                  ⚠️ API EPW indisponível - usando dados locais
                </SelectItem>
              )}
              {tipoOptions.map((tipo) => (
                <SelectItem key={tipo.l} value={tipo.l}>
                  {tipo.d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>


        {/* Modelo Filter */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block flex items-center gap-2">
            Modelo
            {modelosLoading && <Loader2 className="w-3 h-3 animate-spin" />}
            {modelosError && <span className="text-red-400 text-xs">(API erro)</span>}
          </label>
          <Select
            value={filters.modelo}
            onValueChange={(value) => onFilterChange('modelo', value)}
          >
            <SelectTrigger className="bg-card border-border text-white">
              <SelectValue placeholder={
                modelosLoading ? "Carregando modelos da API..." :
                modelosError ? "Erro na API - usando dados locais" :
                "Todos os modelos"
              } />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground z-50">
              <SelectItem value="all">Todos os modelos</SelectItem>
              {modelosError && (
                <SelectItem value="api-error" disabled className="text-muted-foreground">
                  ⚠️ API EPW indisponível - usando dados locais
                </SelectItem>
              )}
              {modeloOptions.map((modelo) => (
                <SelectItem key={modelo.l} value={modelo.l}>
                  {modelo.d} ({modelo.l})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Comprimento Filter */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block flex items-center gap-2">
            Comprimento
            {comprimentosLoading && <Loader2 className="w-3 h-3 animate-spin" />}
            {comprimentosError && <span className="text-red-400 text-xs">(API erro)</span>}
          </label>
          <Select
            value={filters.comprimento}
            onValueChange={(value) => onFilterChange('comprimento', value)}
          >
            <SelectTrigger className="bg-card border-border text-white">
              <SelectValue placeholder={
                comprimentosLoading ? "Carregando comprimentos da API..." :
                comprimentosError ? "Erro na API - usando dados locais" :
                "Todos comprimentos"
              } />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground z-50">
              <SelectItem value="all">Todos comprimentos</SelectItem>
              {comprimentosError && (
                <SelectItem value="api-error" disabled className="text-muted-foreground">
                  ⚠️ API EPW indisponível - usando dados locais
                </SelectItem>
              )}
              {comprimentoOptions.map((comprimento) => (
                <SelectItem key={comprimento.l} value={comprimento.l}>
                  {comprimento.d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cor Filter */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block flex items-center gap-2">
            Cor
            {coresLoading && <Loader2 className="w-3 h-3 animate-spin" />}
            {coresError && <span className="text-red-400 text-xs">(API erro)</span>}
          </label>
          <Select value={filters.cor} onValueChange={(value) => onFilterChange('cor', value)}>
            <SelectTrigger className="bg-card border-border text-white">
              <SelectValue placeholder={
                coresLoading ? "Carregando cores da API..." :
                coresError ? "Erro na API - usando dados locais" :
                "Todas as cores"
              } />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground z-50">
              <SelectItem value="all">Todas as cores</SelectItem>
              {coresError && (
                <SelectItem value="api-error" disabled className="text-muted-foreground">
                  ⚠️ API EPW indisponível - usando dados locais
                </SelectItem>
              )}
              {corOptions.map((cor) => (
                <SelectItem key={cor.l} value={cor.l}>
                  {cor.d} (código: {cor.l})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Acabamento Filter */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block flex items-center gap-2">
            Acabamento
            {acabamentosLoading && <Loader2 className="w-3 h-3 animate-spin" />}
            {acabamentosError && <span className="text-red-400 text-xs">(API erro)</span>}
          </label>
          <Select
            value={filters.acabamento}
            onValueChange={(value) => onFilterChange('acabamento', value)}
          >
            <SelectTrigger className="bg-card border-border text-white">
              <SelectValue placeholder={
                acabamentosLoading ? "Carregando acabamentos da API..." :
                acabamentosError ? "Erro na API - usando dados locais" :
                "Todos acabamentos"
              } />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground z-50">
              <SelectItem value="all">Todos acabamentos</SelectItem>
              {acabamentosError && (
                <SelectItem value="api-error" disabled className="text-muted-foreground">
                  ⚠️ API EPW indisponível - usando dados locais
                </SelectItem>
              )}
              {acabamentoOptions.map((acabamento) => (
                <SelectItem key={acabamento.l} value={acabamento.l}>
                  {acabamento.d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};