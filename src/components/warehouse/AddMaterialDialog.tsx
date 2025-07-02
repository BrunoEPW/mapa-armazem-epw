import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { ShelfLocation } from '@/types/warehouse';
import { toast } from 'sonner';

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
            <Label htmlFor="product">Produto</Label>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                {products.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.modelo} - {product.acabamento} - {product.cor} - {product.comprimento}mm
                  </SelectItem>
                ))}
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