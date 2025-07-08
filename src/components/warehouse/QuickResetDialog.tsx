import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface QuickResetDialogProps {
  open: boolean;
  onClose: () => void;
}

export const QuickResetDialog: React.FC<QuickResetDialogProps> = ({
  open,
  onClose,
}) => {
  const [isResetting, setIsResetting] = useState(false);
  const { clearAllData } = useWarehouse();

  const handleConfirm = async () => {
    setIsResetting(true);
    const success = await clearAllData();
    if (success) {
      onClose();
    }
    setIsResetting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Limpar Todos os Dados
          </DialogTitle>
          <DialogDescription>
            Esta ação irá remover todos os materiais das prateleiras e eliminar todos os produtos.
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>ATENÇÃO:</strong> Todos os dados serão eliminados:
            <ul className="list-disc list-inside mt-2 text-sm">
              <li>Todos os materiais das prateleiras</li>
              <li>Todos os produtos</li>
              <li>Todo o histórico de movimentos</li>
            </ul>
          </AlertDescription>
        </Alert>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={isResetting}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {isResetting ? 'A limpar...' : 'Limpar Tudo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};