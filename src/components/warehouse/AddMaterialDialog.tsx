import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ShelfLocation } from '@/types/warehouse';
import { AddMaterialForm } from './AddMaterialForm';
import SimpleDebugConsole from '@/components/ui/simple-debug-console';

interface AddMaterialDialogProps {
  location: ShelfLocation;
  onClose: () => void;
}

export const AddMaterialDialog: React.FC<AddMaterialDialogProps> = ({
  location,
  onClose,
}) => {
  console.log('AddMaterialDialog - Component mounted with location:', location);
  
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Adicionar Material - {location.estante}{location.prateleira}
          </DialogTitle>
          <DialogDescription>
            Selecione um produto e especifique a quantidade para adicionar ao estoque.
          </DialogDescription>
        </DialogHeader>
        
        <AddMaterialForm
          location={location}
          onSuccess={onClose}
          onCancel={onClose}
        />
        
        <div className="mt-4 border-t pt-4">
          <SimpleDebugConsole />
        </div>
      </DialogContent>
    </Dialog>
  );
};