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
  'ZoomCorp',
  'ZoomGrass',
  'ZoomPatio',
  'ZoomBoard',
  'ZoomFence (Laminado)',
  'ZoomFence (Perfurado)',
  'ZoomCeil',
  'ZoomSiding',
  'ZoomBreeze',
  'ZoomBeam H1',
  'ZoomBeam H2',
  'ZoomPost',
  'ZoomClip',
  'ZoomTrim 40x21',
  'ZoomTrim 20x30',
  'ZoomCorner 40x40',
  'ZoomAngle',
  'ZoomFlashing',
  'ZoomFix 40',
  'ZoomFix 25',
  'ZoomStart 40',
  'ZoomStart 25',
  'ZoomEnd 40',
  'ZoomEnd 25',
  'Parafuso T25-T30 4.8x25',
  'Parafuso T25-T30 4.8x35',
  'Parafuso T25-T30 4.8x45',
  'Parafuso T25-T30 4.8x55',
  'Parafuso T25-T30 4.8x65',
  'Parafuso T25-T30 4.8x75',
  'Cavilha Ø6x30',
  'Cavilha Ø6x40',
  'Cavilha Ø6x50',
  'Cavilha Ø8x40',
  'Cavilha Ø8x50',
  'Cavilha Ø8x60',
  'Cavilha Ø8x70',
  'Cavilha Ø8x80',
  'Cavilha Ø8x100',
  'Cavilha Ø10x60',
  'Cavilha Ø10x80',
  'Cavilha Ø10x100',
];

const ACABAMENTOS = [
  'Lixado',
  'Lixado + Gravado Wood Grain',
  'Lixado + Gravado Groove',
  'Lixado + Gravado Corduroy',
  'Lixado + Gravado Groove + Corduroy',
  'Acanalado',
  'Liso',
  'Perfurado',
];

const CORES = [
  'Antracite',
  'Vulcan',
  'Ebony',
  'Cottage',
  'Cinza',
  'Pérola',
  'Musgo',
  'Cork',
  'Dune',
  'Sand',
  'Walnut',
  'Tobacco',
  'Copper',
  'Rust',
  'Brick',
  'Sage',
  'Stone',
  'Graphite',
  'Charcoal',
  'Slate',
  'Teak',
  'Cedar',
  'Mahogany',
  'Bronze',
  'Silver',
  'Gold',
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