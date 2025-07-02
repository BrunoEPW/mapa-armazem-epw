import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { Product } from '@/types/warehouse';
import { toast } from 'sonner';

interface ProductDialogProps {
  product?: Product;
  onClose: () => void;
}

export const ProductDialog: React.FC<ProductDialogProps> = ({
  product,
  onClose,
}) => {
  const { addProduct, updateProduct } = useWarehouse();
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
      comprimento: parseInt(formData.comprimento),
      foto: formData.foto || undefined,
    };

    if (isEdit && product) {
      updateProduct(product.id, productData);
      toast.success('Produto atualizado com sucesso');
    } else {
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
            <Input
              id="modelo"
              value={formData.modelo}
              onChange={(e) => handleInputChange('modelo', e.target.value)}
              placeholder="Ex: Perfil L"
            />
          </div>

          <div>
            <Label htmlFor="acabamento">Acabamento *</Label>
            <Input
              id="acabamento"
              value={formData.acabamento}
              onChange={(e) => handleInputChange('acabamento', e.target.value)}
              placeholder="Ex: Anodizado"
            />
          </div>

          <div>
            <Label htmlFor="cor">Cor *</Label>
            <Input
              id="cor"
              value={formData.cor}
              onChange={(e) => handleInputChange('cor', e.target.value)}
              placeholder="Ex: Prata"
            />
          </div>

          <div>
            <Label htmlFor="comprimento">Comprimento (mm) *</Label>
            <Input
              id="comprimento"
              type="number"
              value={formData.comprimento}
              onChange={(e) => handleInputChange('comprimento', e.target.value)}
              placeholder="Ex: 2000"
              min="1"
            />
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