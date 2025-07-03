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
  const { getMaterialsByShelf, removeMaterial } = useWarehouse();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [showHistoryFor, setShowHistoryFor] = useState<string | null>(null);

  if (!estante || !prateleira) {
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
          // Three-part view for all shelves
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-[hsl(var(--shelf-left-stock))] text-white rounded-full flex items-center justify-center text-sm font-bold">E</span>
                Lado Esquerdo
              </h3>
              <div className="space-y-4">
                {materials.filter(m => m.location.posicao === 'esquerda').map((material) => (
                  <Card key={material.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {material.product.modelo}
                        </CardTitle>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Acabamento</p>
                          <p className="font-medium">{material.product.acabamento}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Cor</p>
                          <p className="font-medium">{material.product.cor}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Comprimento</p>
                          <p className="font-medium">{material.product.comprimento}mm</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Quantidade</p>
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
                {materials.filter(m => m.location.posicao === 'esquerda').length === 0 && (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground">Lado esquerdo vazio</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-[hsl(var(--shelf-central-stock))] text-white rounded-full flex items-center justify-center text-sm font-bold">C</span>
                Parte Central
              </h3>
              <div className="space-y-4">
                {materials.filter(m => m.location.posicao === 'central' || !m.location.posicao).map((material) => (
                  <Card key={material.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {material.product.modelo}
                        </CardTitle>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Acabamento</p>
                          <p className="font-medium">{material.product.acabamento}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Cor</p>
                          <p className="font-medium">{material.product.cor}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Comprimento</p>
                          <p className="font-medium">{material.product.comprimento}mm</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Quantidade</p>
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
                {materials.filter(m => m.location.posicao === 'central' || !m.location.posicao).length === 0 && (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground">Parte central vazia</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-[hsl(var(--shelf-right-stock))] text-white rounded-full flex items-center justify-center text-sm font-bold">D</span>
                Lado Direito
              </h3>
              <div className="space-y-4">
                {materials.filter(m => m.location.posicao === 'direita').map((material) => (
                  <Card key={material.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {material.product.modelo}
                        </CardTitle>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Acabamento</p>
                          <p className="font-medium">{material.product.acabamento}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Cor</p>
                          <p className="font-medium">{material.product.cor}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Comprimento</p>
                          <p className="font-medium">{material.product.comprimento}mm</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Quantidade</p>
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
                {materials.filter(m => m.location.posicao === 'direita').length === 0 && (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground">Lado direito vazio</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
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

        {/* Debug: Rendering AddMaterialDialog? {showAddDialog} */}

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