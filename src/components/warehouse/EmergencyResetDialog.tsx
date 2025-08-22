import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog';
import { AlertTriangle, RotateCcw, Trash2 } from 'lucide-react';
import { useExclusions } from '@/contexts/ExclusionsContext';
import { toast } from 'sonner';

interface EmergencyResetDialogProps {
  onResetToPage1: () => void;
  onClearCache: () => void;
  excludedCount?: number;
}

export const EmergencyResetDialog: React.FC<EmergencyResetDialogProps> = ({
  onResetToPage1,
  onClearCache,
  excludedCount = 0
}) => {
  const [open, setOpen] = useState(false);
  const { clearAllPrefixes } = useExclusions();

  const handleEmergencyReset = () => {
    // Clear all exclusions
    clearAllPrefixes();
    
    // Clear API cache
    onClearCache();
    
    // Reset to page 1
    onResetToPage1();
    
    toast.success('Sistema resetado com sucesso');
    setOpen(false);
  };

  const shouldShowEmergencyButton = excludedCount > 100; // Lower threshold for emergency

  if (!shouldShowEmergencyButton) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <AlertTriangle className="w-4 h-4 mr-2" />
          Modo de Emergência
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Modo de Emergência
          </DialogTitle>
          <DialogDescription className="text-left">
            Detectada situação crítica com {excludedCount} produtos excluídos.
            <br /><br />
            O reset de emergência irá:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Limpar todas as exclusões ({excludedCount} prefixos)</li>
              <li>Limpar cache da API</li>
              <li>Voltar à página 1</li>
            </ul>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2">
          <Button
            onClick={handleEmergencyReset}
            variant="destructive"
            className="w-full"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Executar Reset de Emergência
          </Button>
          <Button
            onClick={() => setOpen(false)}
            variant="outline"
            className="w-full"
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};