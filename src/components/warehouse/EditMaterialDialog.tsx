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
  console.log('🚀 [EditMaterialDialog] Component mounted with material:', material);
  
  const { updateMaterial, addMovement } = useWarehouse();
  
  console.log('🔍 [EditMaterialDialog] Functions available:', {
    updateMaterial: typeof updateMaterial,
    addMovement: typeof addMovement,
    materialId: material.id
  });
  
  const [pecas, setPecas] = useState(material.pecas.toString());
  const [norc, setNorc] = useState('');
  const [movementType, setMovementType] = useState<'entrada' | 'saida'>('entrada');

  console.log('📊 [EditMaterialDialog] Component state initialized:', {
    initialPecas: pecas,
    materialInfo: {
      id: material.id,
      currentPecas: material.pecas,
      produto: material.product.modelo
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('🔥 [EditMaterialDialog] BUTTON CLICKED - Starting handleSubmit');
    e.preventDefault();
    
    console.log('🔄 [EditMaterialDialog] Starting handleSubmit');
    console.log('🔄 [EditMaterialDialog] Input values:', { pecas, norc, materialId: material.id });
    
    if (!pecas || !norc) {
      console.log('❌ [EditMaterialDialog] Validation failed - missing fields');
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      const newPecas = parseInt(pecas);
      const oldPecas = material.pecas;
      const difference = newPecas - oldPecas;

      console.log('📊 [EditMaterialDialog] Quantity calculation:', {
        newPecas,
        oldPecas,
        difference
      });

      if (difference !== 0) {
        console.log('💾 [EditMaterialDialog] Calling updateMaterial...');
        
        // Simple test: just update local state first
        console.log('🧪 [EditMaterialDialog] Testing simple local update...');
        
        try {
          // Update material quantity
          await updateMaterial(material.id, { pecas: newPecas });
          console.log('✅ [EditMaterialDialog] Material updated successfully');
          
          // Add movement record
          console.log('📝 [EditMaterialDialog] Adding movement...');
          await addMovement({
            materialId: material.id,
            type: difference > 0 ? 'entrada' : 'saida',
            pecas: Math.abs(difference),
            norc,
            date: new Date().toISOString().split('T')[0],
          });
          
          console.log('✅ [EditMaterialDialog] Movement added successfully');
          toast.success('Material atualizado com sucesso');
          
        } catch (updateError) {
          console.error('🔴 [EditMaterialDialog] Error during update:', updateError);
          console.error('🔴 [EditMaterialDialog] Error details:', {
            message: updateError?.message,
            stack: updateError?.stack,
            name: updateError?.name
          });
          throw updateError; // Re-throw to be caught by outer catch
        }
      } else {
        console.log('ℹ️ [EditMaterialDialog] No changes made');
        toast.info('Nenhuma alteração foi feita');
      }

      console.log('🎯 [EditMaterialDialog] Closing dialog');
      onClose();
      
    } catch (error) {
      console.error('🔴 [EditMaterialDialog] Error in handleSubmit:', error);
      toast.error('Erro ao atualizar material');
    }
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