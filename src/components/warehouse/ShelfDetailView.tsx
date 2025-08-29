
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, ArrowUpDown, Trash2, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RandomConfirmDialog } from '@/components/ui/random-confirm-dialog';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { Material, WAREHOUSE_CONFIG } from '@/types/warehouse';
import { AddMaterialDialog } from './AddMaterialDialog';
import { EditMaterialDialog } from './EditMaterialDialog';
import { MovementHistoryDialog } from './MovementHistoryDialog';

const ShelfDetailView: React.FC = () => {
  const navigate = useNavigate();
  const { estante, prateleira } = useParams<{ estante: string; prateleira: string }>();
  const [searchParams] = useSearchParams();
  const highlightMaterialId = searchParams.get('highlight');
  const isReadOnly = searchParams.get('readOnly') === 'true';
  
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
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);

  if (!estante || !prateleira) {
    console.log('❌ ShelfDetailView - Missing route params, navigating to home');
    navigate('/');
    return null;
  }

  const location = { estante, prateleira: parseInt(prateleira) };
  const materials = getMaterialsByShelf(location);

  // Effect to scroll to highlighted material
  useEffect(() => {
    if (highlightMaterialId && materials.length > 0) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`material-${highlightMaterialId}`);
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100); // Small delay to ensure rendering is complete
      
      return () => clearTimeout(timer);
    }
  }, [highlightMaterialId, materials.length]);

  console.log('ShelfDetailView - Current state:', {
    showAddDialog,
    estante,
    prateleira,
    materialsCount: materials.length
  });

  const handleRemoveMaterial = async (materialId: string) => {
    try {
      console.log('🗑️ [ShelfDetailView] Starting material removal:', materialId);
      await removeMaterial(materialId);
      console.log('✅ [ShelfDetailView] Material removed successfully');
    } catch (error) {
      console.error('❌ [ShelfDetailView] Error removing material:', error);
      // Continue anyway since we're in offline mode
    }
  };

  return (
    <div className="min-h-screen bg-warehouse-bg p-8" style={{ backgroundColor: 'hsl(220 20% 6%)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="outline"
            onClick={() => navigate(`/estante/${estante}`)}
            className="flex items-center gap-3 p-3 h-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <div className="flex items-center gap-1">
              {estante && WAREHOUSE_CONFIG.estantes[estante]?.prateleiras.map((shelfNum) => (
                <div
                  key={shelfNum}
                  className={`w-8 h-6 rounded flex items-center justify-center text-xs font-bold ${
                    shelfNum === parseInt(prateleira) 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted/50 text-muted-foreground border border-muted'
                  }`}
                >
                  {shelfNum}
                </div>
              ))}
            </div>
          </Button>
          
          <h1 className="text-3xl font-bold text-foreground">
            Prateleira {estante}{prateleira}
          </h1>
          
          {!isReadOnly && (
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
          )}
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
            {/* Sort materials to show highlighted one first */}
            {materials
              .sort((a, b) => {
                if (highlightMaterialId) {
                  if (a.id === highlightMaterialId) return -1;
                  if (b.id === highlightMaterialId) return 1;
                }
                return 0;
              })
              .map((material) => {
                const isHighlighted = material.id === highlightMaterialId;
                return (
              <Card 
                key={material.id}
                id={`material-${material.id}`}
                className={`cursor-pointer transition-all duration-500 ${
                  isHighlighted 
                    ? 'bg-orange-500/20 border-orange-500/50 ring-2 ring-orange-500/30 hover:bg-orange-500/25 animate-pulse' 
                    : 'hover:bg-white/5'
                }`}
                onClick={() => setShowHistoryFor(material.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    {!isReadOnly && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingMaterial(material);
                          }}
                          title="Registar Movimento"
                        >
                          <ArrowUpDown className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMaterialToDelete(material);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Descrição</p>
                      <p className="font-medium">
                        {material.product.descricao || material.product.modelo}
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
                );
              })}
          </div>
        )}

        {!isReadOnly && showAddDialog && (
          <AddMaterialDialog
            location={location}
            onClose={() => {
              console.log('AddMaterialDialog - onClose called');
              setShowAddDialog(false);
            }}
          />
        )}

        {!isReadOnly && editingMaterial && (
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

        {!isReadOnly && materialToDelete && (
          <RandomConfirmDialog
            open={!!materialToDelete}
            onOpenChange={(open) => !open && setMaterialToDelete(null)}
            title="Confirmar Remoção"
            description="Vai apagar este artigo e perder todo o registo de movimentos... é mesmo isso que quer!!!???"
            confirmText="Sim, Apagar"
            cancelText="Cancelar"
            onConfirm={() => {
              handleRemoveMaterial(materialToDelete.id);
              setMaterialToDelete(null);
            }}
            onCancel={() => setMaterialToDelete(null)}
          />
        )}
      </div>
    </div>
  );
};

export default ShelfDetailView;
