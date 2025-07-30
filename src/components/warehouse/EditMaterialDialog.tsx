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
  console.log('🚀 [EditMaterialDialog] Component mounted with material:', material);
  
  const { updateMaterial, addMovement } = useWarehouse();
  
  console.log('🔍 [EditMaterialDialog] Functions available:', {
    updateMaterial: typeof updateMaterial,
    addMovement: typeof addMovement,
    materialId: material.id
  });
  
  const [pecas, setPecas] = useState(material.pecas.toString());
  const [norc, setNorc] = useState('');
  const [norcType, setNorcType] = useState<'escrever' | 'partidas' | 'amostras'>('escrever');
  const [customNorc, setCustomNorc] = useState('');
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
    
    if (!pecas || !finalNorc) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
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
          norc: finalNorc,
          date: new Date().toISOString().split('T')[0],
        });

        toast.success('Material atualizado com sucesso!');
      } else {
        toast.info('Nenhuma alteração foi feita');
      }

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
            Editar Material - {material.product.modelo}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mb-4 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Artigo</h4>
          <p className="text-sm text-muted-foreground break-words whitespace-normal">
            {material.product.descricao || `${material.product.familia} ${material.product.modelo}`}
          </p>
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
            <Label htmlFor="norcType">Tipo de Saída/Entrada</Label>
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