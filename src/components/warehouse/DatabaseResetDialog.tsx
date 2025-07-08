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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Download, Trash2 } from 'lucide-react';
import { useSupabaseAdminOperations } from '@/hooks/useSupabaseAdminOperations';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DatabaseResetDialogProps {
  open: boolean;
  onClose: () => void;
}

export const DatabaseResetDialog: React.FC<DatabaseResetDialogProps> = ({
  open,
  onClose,
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [step, setStep] = useState<'confirm' | 'final'>('confirm');
  const [isResetting, setIsResetting] = useState(false);
  const { clearDatabase, exportData, canManageDatabase } = useSupabaseAdminOperations();

  const handleReset = () => {
    if (confirmText.toLowerCase() === 'limpar base de dados') {
      setStep('final');
    }
  };

  const handleFinalConfirm = async () => {
    setIsResetting(true);
    const success = await clearDatabase();
    if (success) {
      onClose();
    }
    setIsResetting(false);
  };

  const handleExport = async () => {
    await exportData();
  };

  const handleClose = () => {
    setStep('confirm');
    setConfirmText('');
    onClose();
  };

  if (!canManageDatabase) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Limpar Base de Dados
          </DialogTitle>
          <DialogDescription>
            Esta ação irá eliminar permanentemente todos os produtos, materiais e movimentos.
          </DialogDescription>
        </DialogHeader>

        {step === 'confirm' && (
          <div className="space-y-4">
            <Alert className="border-destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>ATENÇÃO:</strong> Esta operação não pode ser desfeita!
                <br />
                Serão eliminados:
                <ul className="list-disc list-inside mt-2 text-sm">
                  <li>Todos os produtos</li>
                  <li>Todos os materiais das prateleiras</li>
                  <li>Todo o histórico de movimentos</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="confirm">
                Digite <Badge variant="destructive" className="mx-1">limpar base de dados</Badge> para confirmar:
              </Label>
              <Input
                id="confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="limpar base de dados"
                className="text-center"
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleExport} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Fazer Backup Primeiro
              </Button>
              
              <Button 
                variant="destructive" 
                onClick={handleReset}
                disabled={confirmText.toLowerCase() !== 'limpar base de dados'}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Continuar
              </Button>
            </div>
          </div>
        )}

        {step === 'final' && (
          <div className="space-y-4">
            <Alert className="border-destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>CONFIRMAÇÃO FINAL:</strong> Tem a certeza absoluta que quer limpar toda a base de dados?
                <br />
                <span className="text-destructive font-medium">Esta ação é irreversível!</span>
              </AlertDescription>
            </Alert>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep('confirm')}>
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleFinalConfirm}
                disabled={isResetting}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {isResetting ? 'A limpar...' : 'LIMPAR DEFINITIVAMENTE'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};