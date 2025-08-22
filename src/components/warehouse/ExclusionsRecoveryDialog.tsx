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
import { RotateCcw, AlertTriangle } from 'lucide-react';
import { loadFromStorage, STORAGE_KEYS } from '@/lib/storage';
import { useExclusions } from '@/contexts/ExclusionsContext';
import { toast } from 'sonner';

export const ExclusionsRecoveryDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { exclusions } = useExclusions();

  // Check if there's an emergency backup available
  const emergencyBackup = loadFromStorage(`${STORAGE_KEYS.EXCLUSIONS}-emergency-backup`, null);
  const hasBackup = emergencyBackup && emergencyBackup.prefixes && emergencyBackup.prefixes.length > 1;
  const currentCount = exclusions.prefixes.length;
  const backupCount = emergencyBackup?.prefixes?.length || 0;

  // Only show if we have fewer exclusions than the backup
  const shouldShow = hasBackup && currentCount < backupCount;

  if (!shouldShow) {
    return null;
  }

  const handleRestore = () => {
    // Force page reload to trigger recovery in loadExclusions
    window.location.reload();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-amber-600 border-amber-600 hover:bg-amber-50">
          <RotateCcw className="w-4 h-4 mr-2" />
          Recuperar Exclusões ({backupCount})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Recuperar Exclusões Perdidas
          </DialogTitle>
          <DialogDescription className="text-left">
            Detectado backup de emergência com {backupCount} exclusões, mas você tem apenas {currentCount}.
            <br /><br />
            <strong>Backup disponível:</strong>
            <div className="bg-muted p-2 rounded mt-2 text-xs max-h-20 overflow-y-auto">
              {emergencyBackup?.prefixes?.join(', ')}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2">
          <Button
            onClick={handleRestore}
            className="w-full"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Restaurar {backupCount} Exclusões
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