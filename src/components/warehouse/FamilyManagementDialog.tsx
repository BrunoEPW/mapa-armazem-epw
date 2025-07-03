import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit } from 'lucide-react';
import { FAMILIAS, MODELOS_POR_FAMILIA } from '@/data/product-data';
import { toast } from 'sonner';

interface FamilyManagementDialogProps {
  onClose: () => void;
}

export const FamilyManagementDialog: React.FC<FamilyManagementDialogProps> = ({ onClose }) => {
  const [newFamilia, setNewFamilia] = useState('');
  const [newModelo, setNewModelo] = useState('');
  const [selectedFamilia, setSelectedFamilia] = useState('');
  const [editingFamilia, setEditingFamilia] = useState('');
  const [editingModelo, setEditingModelo] = useState('');

  const handleAddFamilia = () => {
    if (!newFamilia.trim()) {
      toast.error('Digite o nome da família');
      return;
    }
    
    if (FAMILIAS.includes(newFamilia)) {
      toast.error('Esta família já existe');
      return;
    }

    // Note: This is a demonstration. In a real app, you'd update the actual data
    toast.success(`Família "${newFamilia}" seria adicionada`);
    setNewFamilia('');
  };

  const handleAddModelo = () => {
    if (!selectedFamilia || !newModelo.trim()) {
      toast.error('Selecione uma família e digite o nome do modelo');
      return;
    }

    const existingModelos = MODELOS_POR_FAMILIA[selectedFamilia as keyof typeof MODELOS_POR_FAMILIA] || [];
    if (existingModelos.includes(newModelo)) {
      toast.error('Este modelo já existe nesta família');
      return;
    }

    // Note: This is a demonstration. In a real app, you'd update the actual data
    toast.success(`Modelo "${newModelo}" seria adicionado à família "${selectedFamilia}"`);
    setNewModelo('');
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestão de Famílias e Modelos</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add New Family */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Nova Família</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="newFamilia">Nome da Família</Label>
                <Input
                  id="newFamilia"
                  value={newFamilia}
                  onChange={(e) => setNewFamilia(e.target.value)}
                  placeholder="Ex: Premium"
                />
              </div>
              <Button onClick={handleAddFamilia} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Família
              </Button>
            </CardContent>
          </Card>

          {/* Add New Model */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Novo Modelo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="familiaSelect">Família</Label>
                <select
                  id="familiaSelect"
                  value={selectedFamilia}
                  onChange={(e) => setSelectedFamilia(e.target.value)}
                  className="w-full h-10 px-3 py-2 border border-input rounded-md bg-background text-sm"
                >
                  <option value="">Selecione uma família</option>
                  {FAMILIAS.map(familia => (
                    <option key={familia} value={familia}>{familia}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="newModelo">Nome do Modelo</Label>
                <Input
                  id="newModelo"
                  value={newModelo}
                  onChange={(e) => setNewModelo(e.target.value)}
                  placeholder="Ex: SuperDeck Pro"
                  disabled={!selectedFamilia}
                />
              </div>
              <Button onClick={handleAddModelo} className="w-full" disabled={!selectedFamilia}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Modelo
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Current Families and Models */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Famílias e Modelos Existentes</h3>
          <div className="grid gap-4">
            {FAMILIAS.map(familia => (
              <Card key={familia}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base">{familia}</CardTitle>
                    <Badge variant="secondary">
                      {(MODELOS_POR_FAMILIA[familia as keyof typeof MODELOS_POR_FAMILIA] || []).length} modelos
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(MODELOS_POR_FAMILIA[familia as keyof typeof MODELOS_POR_FAMILIA] || []).map(modelo => (
                      <Badge key={modelo} variant="outline" className="text-xs">
                        {modelo}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose} variant="outline">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};