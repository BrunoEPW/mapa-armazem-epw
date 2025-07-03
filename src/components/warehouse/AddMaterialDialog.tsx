import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { ShelfLocation } from '@/types/warehouse';
import { toast } from 'sonner';
import { Search } from 'lucide-react';

interface AddMaterialDialogProps {
  location: ShelfLocation;
  onClose: () => void;
}

export const AddMaterialDialog: React.FC<AddMaterialDialogProps> = ({
  location,
  onClose,
}) => {
  console.log('AddMaterialDialog - Component mounted with location:', location);
  const { products, addMaterial, addMovement } = useWarehouse();
  console.log('AddMaterialDialog - Products loaded:', products.length);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [pecas, setPecas] = useState('');
  const [norc, setNorc] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFamilia, setSelectedFamilia] = useState('');
  const [selectedPosicao, setSelectedPosicao] = useState<'esquerda' | 'central' | 'direita'>('central');

  const familias = useMemo(() => {
    const uniqueFamilias = [...new Set(products.map(p => p.familia))];
    return uniqueFamilias.sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    // Filter by family first
    if (selectedFamilia && selectedFamilia !== 'all') {
      filtered = filtered.filter(product => product.familia === selectedFamilia);
    }
    
    // Then filter by search query
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.modelo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.acabamento.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.cor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.comprimento.toString().includes(searchQuery)
      );
    }
    
    return filtered;
  }, [products, searchQuery, selectedFamilia]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('AddMaterialDialog - Form submitted with:', {
      selectedProductId,
      pecas,
      norc,
      location
    });
    
    if (!selectedProductId || !pecas || !norc) {
      console.log('AddMaterialDialog - Validation failed: missing fields');
      toast.error('Preencha todos os campos');
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (!product) {
      toast.error('Produto não encontrado');
      return;
    }

    const newMaterial = {
      productId: selectedProductId,
      product,
      pecas: parseInt(pecas),
      location: location.estante === 'A' ? { ...location, posicao: selectedPosicao } : location,
    };

    console.log('Attempting to add material:', newMaterial);
    console.log('Selected product:', product);
    console.log('Location:', location);

    const createdMaterial = addMaterial(newMaterial);
    console.log('AddMaterialDialog - Material created:', createdMaterial);
    
    // Add movement entry with the correct material ID
    addMovement({
      materialId: createdMaterial.id,
      type: 'entrada' as const,
      pecas: parseInt(pecas),
      norc,
      date: new Date().toISOString().split('T')[0],
    });
    console.log('AddMaterialDialog - Movement added for material:', createdMaterial.id);

    toast.success('Material adicionado com sucesso');
    console.log('AddMaterialDialog - Closing dialog');
    onClose();
  };

  console.log('AddMaterialDialog - Rendering dialog');
  
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Adicionar Material - {location.estante}{location.prateleira}
          </DialogTitle>
          <DialogDescription>
            Selecione um produto e especifique a quantidade para adicionar ao estoque.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div>
            <Label htmlFor="pecas">Número de Peças</Label>
            <Input
              id="pecas"
              type="number"
              value={pecas}
              onChange={(e) => setPecas(e.target.value)}
              placeholder="Ex: 25"
              min="1"
            />
          </div>

          {location.estante === 'A' && (
            <div>
              <Label htmlFor="posicao">Posição na Prateleira</Label>
              <Select value={selectedPosicao} onValueChange={(value) => setSelectedPosicao(value as 'esquerda' | 'central' | 'direita')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a posição" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="esquerda">Lado Esquerdo (E)</SelectItem>
                  <SelectItem value="central">Parte Central (C)</SelectItem>
                  <SelectItem value="direita">Lado Direito (D)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="norc">NORC</Label>
            <Input
              id="norc"
              value={norc}
              onChange={(e) => setNorc(e.target.value)}
              placeholder="Ex: NORC001"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              Adicionar
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};