import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MovementHistoryDialogProps {
  materialId: string;
  onClose: () => void;
}

export const MovementHistoryDialog: React.FC<MovementHistoryDialogProps> = ({
  materialId,
  onClose,
}) => {
  const { movements, materials } = useWarehouse();
  
  const material = materials.find(m => m.id === materialId);
  const materialMovements = movements
    .filter(mov => mov.materialId === materialId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalEntradas = materialMovements
    .filter(mov => mov.type === 'entrada')
    .reduce((sum, mov) => sum + mov.pecas, 0);
    
  const totalSaidas = materialMovements
    .filter(mov => mov.type === 'saida')
    .reduce((sum, mov) => sum + mov.pecas, 0);

  const saldoAtual = totalEntradas - totalSaidas;

  if (!material) {
    return null;
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Histórico de Movimentações
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">Entradas</span>
                </div>
                <p className="text-2xl font-bold">{totalEntradas}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-red-600">
                  <TrendingDown className="w-4 h-4" />
                  <span className="text-sm font-medium">Saídas</span>
                </div>
                <p className="text-2xl font-bold">{totalSaidas}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-sm font-medium text-muted-foreground">Stock</div>
                <p className="text-2xl font-bold">{saldoAtual}</p>
              </CardContent>
            </Card>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {materialMovements.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma movimentação registrada
              </p>
            ) : (
              materialMovements.map((movement) => (
                <Card key={movement.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={movement.type === 'entrada' ? 'default' : 'destructive'}
                          className="flex items-center gap-1"
                        >
                          {movement.type === 'entrada' ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {movement.type === 'entrada' ? 'Entrada' : 'Saída'}
                        </Badge>
                        <span className="font-medium">{movement.pecas} peças</span>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>{movement.norc}</p>
                        <p>{new Date(movement.date).toLocaleDateString('pt-PT')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};