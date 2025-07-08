import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { Product } from '@/types/warehouse';

interface ProductSelectorProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedFamilia: string;
  setSelectedFamilia: (familia: string) => void;
  familias: string[];
  filteredProducts: Product[];
  selectedProductId: string;
  setSelectedProductId: (productId: string) => void;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  searchQuery,
  setSearchQuery,
  selectedFamilia,
  setSelectedFamilia,
  familias,
  filteredProducts,
  selectedProductId,
  setSelectedProductId,
}) => {
  return (
    <div className="space-y-4">
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
        <Label htmlFor="product">Produto ({filteredProducts.length} encontrados)</Label>
        <Select value={selectedProductId} onValueChange={setSelectedProductId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um produto" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {filteredProducts.map(product => (
              <SelectItem key={product.id} value={product.id}>
                {product.modelo} - {product.acabamento} - {product.cor} - {product.comprimento}mm
              </SelectItem>
            ))}
            {filteredProducts.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Nenhum produto encontrado com esses critérios
              </div>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};