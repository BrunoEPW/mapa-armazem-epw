import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RotateCcw, X } from 'lucide-react';
import { detectMaterialLoss, loadMaterials, isPreservationEnabled } from '@/utils/unifiedMaterialManager';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MaterialLossIndicatorProps {
  materials: any[];
  onRestore?: () => void;
}

export const MaterialLossIndicator = ({ materials, onRestore }: MaterialLossIndicatorProps) => {
  const [showIndicator, setShowIndicator] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isPreservationEnabled() || dismissed) return;

    const hasLoss = detectMaterialLoss(materials);
    const hasBackup = loadMaterials() !== null;
    
    setShowIndicator(hasLoss && hasBackup);
  }, [materials, dismissed]);

  const handleRestore = () => {
    const restoredMaterials = loadMaterials();
    
    if (restoredMaterials && restoredMaterials.length > 0) {
      toast.success(`${restoredMaterials.length} materiais disponíveis para restauro!`, {
        description: 'Use o painel de preservação para restaurar os seus dados.',
        duration: 5000
      });
      onRestore?.();
    }
    
    setDismissed(true);
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  if (!showIndicator) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 duration-300">
      <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/50 shadow-lg max-w-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-orange-500 animate-pulse" />
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="text-sm font-medium text-orange-900 dark:text-orange-100">
                Perda de materiais detectada
              </div>
              <div className="text-xs text-orange-700 dark:text-orange-300">
                Backup disponível para restauração
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRestore}
                  className={cn(
                    "flex items-center gap-1 text-xs",
                    "border-orange-300 text-orange-700 hover:bg-orange-100",
                    "dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900/50"
                  )}
                >
                  <RotateCcw className="w-3 h-3" />
                  Ver Restore
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-200"
                >
                  <X className="w-3 h-3" />
                  Dispensar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};