import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';
import { Product } from '@/types/warehouse';

interface ProductDetailsDialogProps {
  product: Product;
  onClose: () => void;
}

export const ProductDetailsDialog: React.FC<ProductDetailsDialogProps> = ({
  product,
  onClose,
}) => {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Detalhes do Produto
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {product.foto ? (
            <div className="flex justify-center">
              <img 
                src={product.foto} 
                alt={product.modelo}
                className="w-32 h-32 object-cover rounded-lg border"
              />
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-32 h-32 bg-muted rounded-lg border flex items-center justify-center">
                <Package className="w-12 h-12 text-muted-foreground" />
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Modelo</p>
              <p className="font-semibold text-lg">{product.modelo}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Acabamento</p>
                <Badge variant="secondary" className="mt-1">{product.acabamento}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cor</p>
                <Badge variant="outline" className="mt-1">{product.cor}</Badge>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Comprimento</p>
              <p className="font-medium">{product.comprimento}mm</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};