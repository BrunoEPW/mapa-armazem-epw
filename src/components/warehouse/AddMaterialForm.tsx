import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { ShelfLocation } from '@/types/warehouse';
import { ProductSelector } from './ProductSelector';
import { useProductSearch } from '@/hooks/useProductSearch';
import { toast } from 'sonner';

interface AddMaterialFormProps {
  location: ShelfLocation;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddMaterialForm: React.FC<AddMaterialFormProps> = ({
  location,
  onSuccess,
  onCancel,
}) => {
  const { products, addMaterial, addMovement } = useWarehouse();
  const [selectedProductId, setSelectedProductId] = useState('');
  const [pecas, setPecas] = useState('');
  const [norc, setNorc] = useState('');
  const [selectedPosicao, setSelectedPosicao] = useState<'esquerda' | 'central' | 'direita'>('central');

  const productSearch = useProductSearch(products);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('AddMaterialForm - Form submitted with:', {
      selectedProductId,
      pecas,
      norc,
      location
    });
    
    if (!selectedProductId || !pecas || !norc) {
      console.log('AddMaterialForm - Validation failed: missing fields');
      toast.error('Preencha todos os campos');
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (!product) {
      toast.error('Produto não encontrado');
      return;
    }

    try {
      const newMaterial = {
        productId: selectedProductId,
        product,
        pecas: parseInt(pecas),
        location: { ...location, posicao: selectedPosicao },
      };

      console.log('Attempting to add material:', newMaterial);
      const createdMaterial = await addMaterial(newMaterial);
      console.log('AddMaterialForm - Material created:', createdMaterial);
      
      // Add movement entry with the correct material ID
      await addMovement({
        materialId: createdMaterial.id,
        type: 'entrada' as const,
        pecas: parseInt(pecas),
        norc,
        date: new Date().toISOString().split('T')[0],
      });
      console.log('AddMaterialForm - Movement added for material:', createdMaterial.id);

      toast.success('Material adicionado com sucesso');
      onSuccess();
    } catch (error) {
      console.error('Error adding material:', error);
      toast.error('Erro ao adicionar material');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ProductSelector
        {...productSearch}
        selectedProductId={selectedProductId}
        setSelectedProductId={setSelectedProductId}
      />

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
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
};