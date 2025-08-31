import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { Material } from '@/types/warehouse';
import { getBestProductDescription } from '@/utils/productDescriptionUpdater';
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
  
  const [movementQuantity, setMovementQuantity] = useState('');
  const [norc, setNorc] = useState('');
  const [norcType, setNorcType] = useState<'escrever' | 'partidas' | 'amostras' | 'devolucao'>('escrever');
  const [customNorc, setCustomNorc] = useState('');
  const [movementType, setMovementType] = useState<'entrada' | 'saida' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Determine the final NORC value based on type
    let finalNorc = '';
    if (norcType === 'escrever') {
      finalNorc = customNorc;
    } else if (norcType === 'partidas') {
      finalNorc = 'PARTIDAS';
    } else if (norcType === 'amostras') {
      finalNorc = `AMOSTRAS - ${customNorc}`;
    } else if (norcType === 'devolucao') {
      finalNorc = `DEVOLUÇÃO - ${customNorc}`;
    }
    
    if (!movementQuantity || !finalNorc) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      const movementPecas = parseInt(movementQuantity);
      const currentPecas = material.pecas;
      
      // Calculate new total based on movement type
      const newTotal = movementType === 'entrada' 
        ? currentPecas + movementPecas 
        : currentPecas - movementPecas;

      if (newTotal < 0) {
        toast.error('Quantidade insuficiente em stock');
        return;
      }

      // Update material quantity
      await updateMaterial(material.id, { pecas: newTotal });
      
      // Add movement record
      await addMovement({
        materialId: material.id,
        type: movementType,
        pecas: movementPecas,
        norc: finalNorc,
        date: new Date().toISOString().split('T')[0],
      });

      toast.success('Movimento registado com sucesso!');

      onClose();
      
    } catch (error) {
      toast.error(`Erro: ${error?.message || 'Erro desconhecido'}`);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {getBestProductDescription(material.product)}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Quantidade de Peças Atual</Label>
            <div className="p-3 bg-muted rounded-lg">
              <span className="text-lg font-semibold">{material.pecas} peças</span>
            </div>
          </div>
          
          <div>
            <Label>Tipo de Movimento</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button
                type="button"
                variant={movementType === 'entrada' ? 'default' : 'outline'}
                onClick={() => {
                  setMovementType('entrada');
                  setNorcType('escrever');
                  setCustomNorc('');
                }}
                className="w-full"
              >
                Entrada
              </Button>
              <Button
                type="button"
                variant={movementType === 'saida' ? 'default' : 'outline'}
                onClick={() => {
                  setMovementType('saida');
                  setNorcType('escrever');
                  setCustomNorc('');
                }}
                className="w-full"
              >
                Saída
              </Button>
            </div>
          </div>

          {movementType && (
            <div>
              <Label htmlFor="movementQuantity">Quantidade de Peças a {movementType === 'entrada' ? 'Entrar' : 'Sair'}</Label>
              <Input
                id="movementQuantity"
                type="number"
                value={movementQuantity}
                onChange={(e) => setMovementQuantity(e.target.value)}
                placeholder="Ex: 10"
                min="1"
              />
            </div>
          )}

          {movementType && (
            <div>
              <Label>Tipo</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  type="button"
                  variant={norcType === 'escrever' ? 'default' : 'outline'}
                  onClick={() => setNorcType('escrever')}
                  className="w-full"
                >
                  NORC
                </Button>
                {movementType === 'entrada' ? (
                  <Button
                    type="button"
                    variant={norcType === 'devolucao' ? 'default' : 'outline'}
                    onClick={() => setNorcType('devolucao')}
                    className="w-full"
                  >
                    Devolução
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant={norcType === 'partidas' ? 'default' : 'outline'}
                      onClick={() => setNorcType('partidas')}
                      className="w-full"
                    >
                      Partidas
                    </Button>
                  </>
                )}
              </div>
              {movementType === 'saida' && (
                <div className="mt-2">
                  <Button
                    type="button"
                    variant={norcType === 'amostras' ? 'default' : 'outline'}
                    onClick={() => setNorcType('amostras')}
                    className="w-full"
                  >
                    Amostras
                  </Button>
                </div>
              )}
            </div>
          )}

          {(norcType === 'escrever' || norcType === 'amostras' || norcType === 'devolucao') && (
            <div>
              <Label htmlFor="customNorc">
                {norcType === 'escrever' ? 'NORC' : 
                 norcType === 'devolucao' ? 'Nome do Cliente' : 
                 'Nome da Amostra'}
              </Label>
              <Input
                id="customNorc"
                value={customNorc}
                onChange={(e) => setCustomNorc(e.target.value)}
                placeholder={
                  norcType === 'escrever' ? 'Ex: NORC001, OF123456' : 
                  norcType === 'devolucao' ? 'Ex: Cliente ABC, Lda' : 
                  'Ex: Amostra Cliente X'
                }
              />
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              Registar Movimento
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