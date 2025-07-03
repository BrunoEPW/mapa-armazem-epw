import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { Product } from '@/types/warehouse';
import { toast } from 'sonner';

// Listas pré-definidas para facilitar a criação de produtos
const MODELOS = [
  'ZoomDeck',
  'EpDeck',
  'LcDeck',
  'HavDeck',
  'WPC Fascia',
  'LcDeck Classic',
  'LX120 Flat',
  'XXL183 Flat',
  'XXL183 Ribbed',
  'Sarrafo Compósito',
  'Travessa aluminio 50x50',
  'LX120 Ribbed',
  'LX122 Ribbed',
  'EzWall',
  'Queixo de Escada LcDeck',
  'Queixo de Escada EpDeck',
  'Queixo de Escada HavDeck',
  'Queixo de Escada ZoomDeck',
  'Titanium Deck Flat',
  'Titanium Deck Ribbed',
  'HavDeck Solid',
  'XL138 Ribbed',
  'XL138 Flat',
  'Canto 35x48mm',
  'Remate Titanium Flat',
  'Bamboo',
  'Sarrafo PVC',
  'Castellation',
  'Remater Titanium Ribbed',
  'Titanium deck HD',
  'Navigator Flat WG',
  'Navigator Ribbed',
  'Navigator Flat WG Remate',
  'Navigator Ribbed Remate',
  'Navigator Wall WG',
  'Navigator Castellation',
  'Navigator Fascia',
  'EzClip',
  'EzClip Deck e Deck',
  'Base Castle',
  'Exterior Castle',
  'Base EzWall',
  'Exterior EzWall',
  '"L" 35x49',
  '"L" 35x90',
  '"L"35x150',
  'Clip Navigator',
  'Travessa aluminio 50x30',
  'Canto PVC 55x55x2',
];

const ACABAMENTOS = [
  'Lixado',
  'Lixado + Gravado Wood Grain',
  'Tynex',
  'Escovado',
  'Sem',
  'SG',
  'TT',
  'WG',
];

const CORES = [
  'Antracite',
  'Vulcan',
  'Chocolate',
  'Mid Brown',
  'Bronze',
  'Golden Brown',
  'Faia / Oak',
  'Latte',
  'Gold8',
  'Camel',
  'Natural',
  'Grey',
  'Green',
  'Artic Ice',
  'Cumaru',
  'Sucupira',
  'Teka',
  'Light Carbonized',
  'Rustik Grey',
  'RoseWood',
  'Silver',
  'Perola',
  'IPE',
  'Antique',
  'Latte',
  'White',
];

const COMPRIMENTOS = [
  '1500',
  '2300',
  '3200',
  '3600',
  'metro linear',
  '3000',
  '2250',
  '2500',
];

interface ProductDialogProps {
  product?: Product;
  onClose: () => void;
}

export const ProductDialog: React.FC<ProductDialogProps> = ({
  product,
  onClose,
}) => {
  const { addProduct, updateProduct, products } = useWarehouse();
  const isEdit = !!product;
  
  const [formData, setFormData] = useState({
    modelo: product?.modelo || '',
    acabamento: product?.acabamento || '',
    cor: product?.cor || '',
    comprimento: product?.comprimento?.toString() || '',
    foto: product?.foto || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.modelo || !formData.acabamento || !formData.cor || !formData.comprimento) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const productData = {
      modelo: formData.modelo,
      acabamento: formData.acabamento,
      cor: formData.cor,
      comprimento: formData.comprimento === 'metro linear' ? 'metro linear' : parseInt(formData.comprimento),
      foto: formData.foto || undefined,
    };

    if (isEdit && product) {
      updateProduct(product.id, productData);
      toast.success('Produto atualizado com sucesso');
    } else {
      // Check for duplicates before adding
      const isDuplicate = products.some(p => 
        p.modelo === productData.modelo &&
        p.acabamento === productData.acabamento &&
        p.cor === productData.cor &&
        p.comprimento === productData.comprimento
      );

      if (isDuplicate) {
        toast.error('Este produto já existe no sistema');
        return;
      }

      addProduct(productData);
      toast.success('Produto adicionado com sucesso');
    }

    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="modelo">Modelo *</Label>
            <Select value={formData.modelo} onValueChange={(value) => handleInputChange('modelo', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um modelo" />
              </SelectTrigger>
              <SelectContent>
                {MODELOS.map((modelo) => (
                  <SelectItem key={modelo} value={modelo}>
                    {modelo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="acabamento">Acabamento *</Label>
            <Select value={formData.acabamento} onValueChange={(value) => handleInputChange('acabamento', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um acabamento" />
              </SelectTrigger>
              <SelectContent>
                {ACABAMENTOS.map((acabamento) => (
                  <SelectItem key={acabamento} value={acabamento}>
                    {acabamento}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="cor">Cor *</Label>
            <Select value={formData.cor} onValueChange={(value) => handleInputChange('cor', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma cor" />
              </SelectTrigger>
              <SelectContent>
                {CORES.map((cor) => (
                  <SelectItem key={cor} value={cor}>
                    {cor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="comprimento">Comprimento (mm) *</Label>
            <Select value={formData.comprimento} onValueChange={(value) => handleInputChange('comprimento', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um comprimento" />
              </SelectTrigger>
              <SelectContent>
                {COMPRIMENTOS.map((comprimento) => (
                  <SelectItem key={comprimento} value={comprimento}>
                    {comprimento === 'metro linear' ? comprimento : `${comprimento} mm`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="foto">URL da Foto (opcional)</Label>
            <Input
              id="foto"
              value={formData.foto}
              onChange={(e) => handleInputChange('foto', e.target.value)}
              placeholder="Ex: https://exemplo.com/foto.jpg"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {isEdit ? 'Atualizar' : 'Adicionar'}
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