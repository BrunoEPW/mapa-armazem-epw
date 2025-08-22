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
import { AlertTriangle, Trash2, RotateCcw } from 'lucide-react';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useSupabaseWarehouseData } from '@/hooks/useSupabaseWarehouseData';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { config } from '@/lib/config';

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
  const [isRestoringMock, setIsRestoringMock] = useState(false);
  const [preserveMaterials, setPreserveMaterials] = useState(true);
  const { clearAllData, clearDataPreservingMaterials, clearAllMaterials } = useWarehouse();
  const { restoreMockData } = useSupabaseWarehouseData();

  const handleConfirm = async () => {
    setIsResetting(true);
    const success = preserveMaterials 
      ? await clearDataPreservingMaterials()
      : await clearAllData();
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

  const handleRestoreMockData = async () => {
    setIsRestoringMock(true);
    if (restoreMockData) {
      await restoreMockData();
      onClose();
    }
    setIsRestoringMock(false);
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
            Escolha o que pretende limpar do armazém. Em modo desenvolvimento, pode restaurar os dados mock quando necessário.
          </DialogDescription>
        </DialogHeader>

        {config.auth.useMockAuth && (
          <Alert className="border-amber-500">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>🔧 Modo Desenvolvimento</strong><br/>
              Aplicação em modo de desenvolvimento com dados mock.
            </AlertDescription>
          </Alert>
        )}
        
        <Alert className="border-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>🔒 Proteção de Materiais Ativa</strong><br/>
            Os materiais serão automaticamente preservados durante atualizações.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="flex items-center space-x-2 p-3 border rounded-lg bg-muted/50">
            <Checkbox 
              id="preserve-materials" 
              checked={preserveMaterials}
              onCheckedChange={(checked) => setPreserveMaterials(checked as boolean)}
            />
            <label 
              htmlFor="preserve-materials" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Preservar materiais das prateleiras
            </label>
          </div>
          <Button 
            variant="destructive" 
            onClick={handleClearMaterials}
            disabled={isClearingMaterials || isResetting || isRestoringMock}
            className="w-full flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {isClearingMaterials ? 'A remover materiais...' : 'Remover Apenas Materiais das Prateleiras'}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleConfirm}
            disabled={isResetting || isClearingMaterials || isRestoringMock}
            className="w-full flex items-center gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="w-4 h-4" />
            {isResetting 
              ? (preserveMaterials ? 'A limpar produtos...' : 'A limpar tudo...') 
              : (preserveMaterials ? 'Limpar Apenas Produtos' : 'Limpar Tudo (Materiais + Produtos)')
            }
          </Button>

          {config.auth.useMockAuth && (
            <Button 
              variant="secondary" 
              onClick={handleRestoreMockData}
              disabled={isResetting || isClearingMaterials || isRestoringMock}
              className="w-full flex items-center gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <RotateCcw className="w-4 h-4" />
              {isRestoringMock ? 'A restaurar dados mock...' : 'Restaurar Dados Mock'}
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={isResetting || isClearingMaterials || isRestoringMock}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};