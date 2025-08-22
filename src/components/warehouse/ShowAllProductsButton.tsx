import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { useExclusions } from '@/contexts/ExclusionsContext';
import { toast } from 'sonner';

interface ShowAllProductsButtonProps {
  onRefresh?: () => void;
}

export const ShowAllProductsButton: React.FC<ShowAllProductsButtonProps> = ({ onRefresh }) => {
  const { exclusions, toggleEnabled } = useExclusions();

  const handleShowAllProducts = () => {
    if (exclusions.enabled) {
      toggleEnabled();
      toast.success('Exclusões desativadas - Todos os produtos serão exibidos');
      onRefresh?.();
    } else {
      toggleEnabled();
      toast.info('Exclusões reativadas');
      onRefresh?.();
    }
  };

  const buttonText = exclusions.enabled ? 'Mostrar Todos os Produtos' : 'Reativar Exclusões';
  const buttonVariant = exclusions.enabled ? 'default' : 'outline';

  return (
    <Button 
      onClick={handleShowAllProducts}
      variant={buttonVariant}
      size="sm"
      className="flex items-center gap-2"
    >
      <Eye className="w-4 h-4" />
      {buttonText}
    </Button>
  );
};