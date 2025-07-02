import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  const { products, addMaterial, addMovement } = useWarehouse();
  const [selectedProductId, setSelectedProductId] = useState('');
  const [pecas, setPecas] = useState('');
  const [norc, setNorc] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    return products.filter(product =>
      product.modelo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.acabamento.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.cor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.comprimento.toString().includes(searchQuery)
    );
  }, [products, searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProductId || !pecas || !norc) {
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
      location,
    };

    addMaterial(newMaterial);
    
    // Add movement entry
    addMovement({
      materialId: `m${Date.now()}`, // This will be updated with the actual material ID
      type: 'entrada' as const,
      pecas: parseInt(pecas),
      norc,
      date: new Date().toISOString().split('T')[0],
    });

    toast.success('Material adicionado com sucesso');
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Adicionar Material - {location.estante}{location.prateleira}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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