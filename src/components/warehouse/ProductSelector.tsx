import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Wifi, WifiOff } from 'lucide-react';
import { Product } from '@/types/warehouse';
import { CombinedProduct } from '@/hooks/useCombinedProducts';

interface ProductSelectorProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedFamilia: string;
  setSelectedFamilia: (familia: string) => void;
  selectedSource?: 'all' | 'local' | 'api';
  setSelectedSource?: (source: 'all' | 'local' | 'api') => void;
  familias: string[];
  filteredProducts: Product[] | CombinedProduct[];
  selectedProductId: string;
  setSelectedProductId: (productId: string) => void;
  loading?: boolean;
  showSourceFilter?: boolean;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  searchQuery,
  setSearchQuery,
  selectedFamilia,
  setSelectedFamilia,
  selectedSource = 'all',
  setSelectedSource,
  familias,
  filteredProducts,
  selectedProductId,
  setSelectedProductId,
  loading = false,
  showSourceFilter = false,
}) => {
  const hasApiProducts = filteredProducts.some(p => 'isFromApi' in p && p.isFromApi);
  
  const getProductDisplayText = (product: Product | CombinedProduct) => {
    const baseText = `${product.modelo} - ${product.acabamento} - ${product.cor} - ${product.comprimento}mm`;
    return baseText;
  };
  
  const getProductBadge = (product: Product | CombinedProduct) => {
    if ('isFromApi' in product && product.isFromApi) {
      return (
        <Badge variant="secondary" className="ml-2 text-xs">
          <Wifi className="w-3 h-3 mr-1" />
          API
        </Badge>
      );
    }
    return null;
  };
  return (
    <div className="space-y-4">
      {showSourceFilter && hasApiProducts && setSelectedSource && (
        <div>
          <Label htmlFor="source">Origem dos Produtos</Label>
          <Select value={selectedSource} onValueChange={setSelectedSource}>
            <SelectTrigger>
              <SelectValue placeholder="Todas as origens" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os produtos</SelectItem>
              <SelectItem value="local">
                <div className="flex items-center">
                  <WifiOff className="w-4 h-4 mr-2" />
                  Produtos locais
                </div>
              </SelectItem>
              <SelectItem value="api">
                <div className="flex items-center">
                  <Wifi className="w-4 h-4 mr-2" />
                  Produtos da API
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="familia">Família do Produto</Label>
        <Select value={selectedFamilia} onValueChange={setSelectedFamilia}>
          <SelectTrigger>
            <SelectValue placeholder="Todas as famílias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as famílias</SelectItem>
            {familias.map(familia => (
              <SelectItem key={familia} value={familia}>
                {familia}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="search">Pesquisar Produto</Label>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por modelo, acabamento, cor ou comprimento..."
            className="pl-10"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="product">
          Produto ({filteredProducts.length} encontrados)
          {loading && <span className="text-muted-foreground"> - Carregando API...</span>}
        </Label>
        <Select value={selectedProductId} onValueChange={setSelectedProductId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um produto" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {filteredProducts.map(product => (
              <SelectItem key={product.id} value={product.id}>
                <div className="flex items-center justify-between w-full">
                  <span>{getProductDisplayText(product)}</span>
                  {getProductBadge(product)}
                </div>
              </SelectItem>
            ))}
            {filteredProducts.length === 0 && !loading && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Nenhum produto encontrado com esses critérios
              </div>
            )}
            {loading && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Carregando produtos da API...
              </div>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};