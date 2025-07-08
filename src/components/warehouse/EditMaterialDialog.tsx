import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { Material } from '@/types/warehouse';
import { toast } from 'sonner';

interface EditMaterialDialogProps {
  material: Material;
  onClose: () => void;
}

export const EditMaterialDialog: React.FC<EditMaterialDialogProps> = ({
  material,
  onClose,
}) => {
  const { updateMaterial, addMovement } = useWarehouse();
  const [pecas, setPecas] = useState(material.pecas.toString());
  const [norc, setNorc] = useState('');
  const [movementType, setMovementType] = useState<'entrada' | 'saida'>('entrada');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pecas || !norc) {
      toast.error('Preencha todos os campos');
      return;
    }

    const newPecas = parseInt(pecas);
    const oldPecas = material.pecas;
    const difference = newPecas - oldPecas;

    if (difference !== 0) {
      // Update material quantity
      await updateMaterial(material.id, { pecas: newPecas });
      
      // Add movement record
      await addMovement({
        materialId: material.id,
        type: difference > 0 ? 'entrada' : 'saida',
        pecas: Math.abs(difference),
        norc,
        date: new Date().toISOString().split('T')[0],
      });

      toast.success('Material atualizado com sucesso');
    } else {
      toast.info('Nenhuma alteração foi feita');
    }

    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Editar Material - {material.product.modelo}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mb-4 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Detalhes do Produto</h4>
          <p><strong>Modelo:</strong> {material.product.modelo}</p>
          <p><strong>Acabamento:</strong> {material.product.acabamento}</p>
          <p><strong>Cor:</strong> {material.product.cor}</p>
          <p><strong>Comprimento:</strong> {material.product.comprimento}mm</p>
          <p><strong>Localização:</strong> {material.location.estante}{material.location.prateleira}</p>
          <p><strong>Quantidade Atual:</strong> {material.pecas} peças</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="pecas">Nova Quantidade de Peças</Label>
            <Input
              id="pecas"
              type="number"
              value={pecas}
              onChange={(e) => setPecas(e.target.value)}
              placeholder="Ex: 25"
              min="0"
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
              Atualizar
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