import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ShelfLocation } from '@/types/warehouse';
import { AddMaterialForm } from './AddMaterialForm';
import DebugConsole from '@/components/ui/debug-console';

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
          <h3 className="text-sm font-medium mb-2">Debug Console</h3>
          <DebugConsole />
        </div>
      </DialogContent>
    </Dialog>
  );
};