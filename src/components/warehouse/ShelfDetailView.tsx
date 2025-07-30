
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { Material } from '@/types/warehouse';
import { AddMaterialDialog } from './AddMaterialDialog';
import { EditMaterialDialog } from './EditMaterialDialog';
import { MovementHistoryDialog } from './MovementHistoryDialog';

const ShelfDetailView: React.FC = () => {
  const navigate = useNavigate();
  const { estante, prateleira } = useParams<{ estante: string; prateleira: string }>();
  
  // Add debugging for warehouse context
  console.log('🔍 ShelfDetailView - Attempting to use warehouse context...');
  
  let warehouseContext;
  try {
    warehouseContext = useWarehouse();
    console.log('✅ ShelfDetailView - Warehouse context loaded successfully');
  } catch (error) {
    console.error('❌ ShelfDetailView - Error loading warehouse context:', error);
    // Fallback - redirect to home if context fails
    navigate('/');
    return <div>Erro: Contexto do armazém não disponível. A redirecionar...</div>;
  }
  
  const { getMaterialsByShelf, removeMaterial } = warehouseContext;
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [showHistoryFor, setShowHistoryFor] = useState<string | null>(null);

  if (!estante || !prateleira) {
    console.log('❌ ShelfDetailView - Missing route params, navigating to home');
    navigate('/');
    return null;
  }

  const location = { estante, prateleira: parseInt(prateleira) };
  const materials = getMaterialsByShelf(location);

  console.log('ShelfDetailView - Current state:', {
    showAddDialog,
    estante,
    prateleira,
    materialsCount: materials.length
  });

  const handleRemoveMaterial = (materialId: string) => {
    if (confirm('Tem certeza que deseja remover este material?')) {
      removeMaterial(materialId);
    }
  };

  return (
    <div className="min-h-screen bg-warehouse-bg p-8" style={{ backgroundColor: 'hsl(220 20% 6%)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="outline"
            onClick={() => navigate(`/estante/${estante}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar à Estante
          </Button>
          
          <h1 className="text-3xl font-bold text-foreground">
            Prateleira {estante}{prateleira}
          </h1>
          
          <Button
            onClick={() => {
              console.log('Adicionar Material button clicked!');
              setShowAddDialog(true);
              console.log('showAddDialog set to true');
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar Material
          </Button>
        </div>

        {materials.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground text-lg mb-4">
                Esta prateleira está vazia
              </p>
              <p className="text-sm text-muted-foreground">
                Use o botão "Adicionar Material" no topo da página para começar
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.map((material) => (
              <Card key={material.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowHistoryFor(material.id)}
                      >
                        <History className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingMaterial(material)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveMaterial(material.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Descrição</p>
                      <p className="font-medium">
                        {material.product.descricao || `${material.product.familia} ${material.product.modelo}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Quantidade na Prateleira</p>
                      <Badge 
                        variant={material.pecas < 10 ? "destructive" : "default"}
                        className="text-lg px-3 py-1"
                      >
                        {material.pecas} peças
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {showAddDialog && (
          <AddMaterialDialog
            location={location}
            onClose={() => {
              console.log('AddMaterialDialog - onClose called');
              setShowAddDialog(false);
            }}
          />
        )}

        {editingMaterial && (
          <EditMaterialDialog
            material={editingMaterial}
            onClose={() => setEditingMaterial(null)}
          />
        )}

        {showHistoryFor && (
          <MovementHistoryDialog
            materialId={showHistoryFor}
            onClose={() => setShowHistoryFor(null)}
          />
        )}
      </div>
    </div>
  );
};

export default ShelfDetailView;
