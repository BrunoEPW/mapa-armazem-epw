import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { Product } from '@/types/warehouse';
import { toast } from 'sonner';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { FAMILIAS, MODELOS_POR_FAMILIA, ACABAMENTOS, CORES, COMPRIMENTOS } from '@/data/product-data';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    familia: product?.familia || '',
    modelo: product?.modelo || '',
    acabamento: product?.acabamento || '',
    cor: product?.cor || '',
    comprimento: product?.comprimento?.toString() || '',
    foto: product?.foto || '',
  });

  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.familia || !formData.modelo || !formData.acabamento || !formData.cor || !formData.comprimento) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const productData = {
      familia: formData.familia,
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
        p.familia === productData.familia &&
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato de arquivo não suportado. Use JPG, PNG ou WebP.');
      return;
    }

    // Validate file size (2MB limit)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Tamanho máximo: 2MB.');
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      handleInputChange('foto', result);
      setIsUploading(false);
      toast.success('Imagem carregada com sucesso!');
    };

    reader.onerror = () => {
      setIsUploading(false);
      toast.error('Erro ao carregar a imagem.');
    };

    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    handleInputChange('foto', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
            <Label htmlFor="familia">Família *</Label>
            <Select value={formData.familia} onValueChange={(value) => {
              handleInputChange('familia', value);
              handleInputChange('modelo', ''); // Reset modelo when familia changes
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma família" />
              </SelectTrigger>
              <SelectContent>
                {FAMILIAS.map((familia) => (
                  <SelectItem key={familia} value={familia}>
                    {familia}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="modelo">Modelo *</Label>
            <Select 
              value={formData.modelo} 
              onValueChange={(value) => handleInputChange('modelo', value)}
              disabled={!formData.familia}
            >
              <SelectTrigger>
                <SelectValue placeholder={formData.familia ? "Selecione um modelo" : "Selecione primeiro uma família"} />
              </SelectTrigger>
              <SelectContent>
                {formData.familia && MODELOS_POR_FAMILIA[formData.familia as keyof typeof MODELOS_POR_FAMILIA]?.map((modelo) => (
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

          <div className="space-y-3">
            <Label>Foto do Produto (opcional)</Label>
            
            {/* Image Preview */}
            {formData.foto && (
              <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-muted">
                <img 
                  src={formData.foto} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '';
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 h-6 w-6 p-0"
                  onClick={removeImage}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}

            {/* Upload Options */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Escolher Arquivo
                  </>
                )}
              </Button>
              
              {!formData.foto && (
                <div className="flex-1">
                  <Input
                    placeholder="Ou cole URL da imagem..."
                    value={formData.foto.startsWith('data:') ? '' : formData.foto}
                    onChange={(e) => handleInputChange('foto', e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Help Text */}
            <p className="text-xs text-muted-foreground">
              Formatos aceites: JPG, PNG, WebP • Tamanho máximo: 2MB
            </p>
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