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
  const [isClearingMaterials, setIsClearingMaterials] = useState(false);
  const { clearAllData, clearAllMaterials } = useWarehouse();

  const handleConfirm = async () => {
    setIsResetting(true);
    const success = await clearAllData();
    if (success) {
      onClose();
    }
    setIsResetting(false);
  };

  const handleClearMaterials = async () => {
    setIsClearingMaterials(true);
    const success = await clearAllMaterials();
    if (success) {
      onClose();
    }
    setIsClearingMaterials(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Opções de Limpeza
          </DialogTitle>
          <DialogDescription>
            Escolha o que pretende limpar do armazém.
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Escolha uma opção:</strong>
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Button 
            variant="destructive" 
            onClick={handleClearMaterials}
            disabled={isClearingMaterials || isResetting}
            className="w-full flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {isClearingMaterials ? 'A remover materiais...' : 'Remover Apenas Materiais das Prateleiras'}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleConfirm}
            disabled={isResetting || isClearingMaterials}
            className="w-full flex items-center gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="w-4 h-4" />
            {isResetting ? 'A limpar tudo...' : 'Limpar Tudo (Materiais + Produtos)'}
          </Button>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={isResetting || isClearingMaterials}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};