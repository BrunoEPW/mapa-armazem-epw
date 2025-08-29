import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  
  console.log('🔍 [EditMaterialDialog] Functions available:', {
    updateMaterial: typeof updateMaterial,
    addMovement: typeof addMovement,
    materialId: material.id
  });
  
  const [movementQuantity, setMovementQuantity] = useState('');
  const [norc, setNorc] = useState('');
  const [norcType, setNorcType] = useState<'escrever' | 'partidas' | 'amostras'>('escrever');
  const [customNorc, setCustomNorc] = useState('');
  const [movementType, setMovementType] = useState<'entrada' | 'saida'>('entrada');

  console.log('📊 [EditMaterialDialog] Component state initialized:', {
    currentPecas: material.pecas,
    materialInfo: {
      id: material.id,
      currentPecas: material.pecas,
      produto: material.product.modelo
    }
  });

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
      console.error('Error updating material:', error);
      toast.error(`Erro: ${error?.message || 'Erro desconhecido'}`);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {material.product.descricao || `${material.product.familia} ${material.product.modelo}`}
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
            <Label htmlFor="movementType">Tipo de Movimento</Label>
            <Select value={movementType} onValueChange={(value: 'entrada' | 'saida') => setMovementType(value)}>
              <SelectTrigger className="w-full bg-background border border-border">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border shadow-lg z-50">
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
              </SelectContent>
            </Select>
          </div>

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

          <div>
            <Label htmlFor="norcType">NORC</Label>
            <Select value={norcType} onValueChange={(value: 'escrever' | 'partidas' | 'amostras') => setNorcType(value)}>
              <SelectTrigger className="w-full bg-background border border-border">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border shadow-lg z-50">
                <SelectItem value="escrever">NORC (Entrada/Saída)</SelectItem>
                <SelectItem value="partidas">Partidas (Saída)</SelectItem>
                <SelectItem value="amostras">Amostras (Saída)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(norcType === 'escrever' || norcType === 'amostras') && (
            <div>
              <Label htmlFor="customNorc">
                {norcType === 'escrever' ? 'NORC (Número de Ordem)' : 'Nome da Amostra'}
              </Label>
              <Input
                id="customNorc"
                value={customNorc}
                onChange={(e) => setCustomNorc(e.target.value)}
                placeholder={norcType === 'escrever' ? 'Ex: NORC001, OF123456' : 'Ex: Amostra Cliente X'}
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