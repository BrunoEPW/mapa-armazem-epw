
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
import { enhanceProductDescription } from '@/utils/productDescriptionGenerator';

const ShelfDetailView: React.FC = () => {
  const navigate = useNavigate();
  const { estante, prateleira } = useParams<{ estante: string; prateleira: string }>();
  const [searchParams] = useSearchParams();
  const highlightMaterialId = searchParams.get('highlight');
  const isReadOnly = searchParams.get('readOnly') === 'true';
  
  let warehouseContext;
  try {
    warehouseContext = useWarehouse();
  } catch (error) {
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


  const handleRemoveMaterial = async (materialId: string) => {
    try {
      await removeMaterial(materialId);
    } catch (error) {
      // Continue anyway since we're in offline mode
    }
  };

  return (
    <div className="min-h-screen bg-warehouse-bg p-8" style={{ backgroundColor: 'hsl(220 20% 6%)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white hover:text-orange-400 transition-colors duration-200 p-2 rounded-lg hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Voltar</span>
          </button>
        </div>
        
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
                setShowAddDialog(true);
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
                // Only highlight if:
                // 1. There's a highlight parameter AND
                // 2. Either coming from search page OR has explicit fromSearch parameter
                const hasHighlightParam = highlightMaterialId === material.id;
                const isFromAdvancedSearch = searchParams.get('fromSearch') === 'true';
                const isHighlighted = hasHighlightParam && isFromAdvancedSearch;
                return (
              <Card 
                key={material.id}
                id={`material-${material.id}`}
                className={`relative cursor-pointer transition-all duration-500 ${
                  isHighlighted 
                    ? 'bg-orange-500/20 border-orange-500/50 ring-2 ring-orange-500/30 hover:bg-orange-500/25 animate-pulse' 
                    : 'hover:bg-white/5'
                }`}
                onClick={() => setShowHistoryFor(material.id)}
              >
                <CardHeader className="pb-2">
                  {!isReadOnly && (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingMaterial(material);
                      }}
                      title="Registar Movimento"
                      className="w-full flex items-center justify-center gap-2 h-12 px-4 hover-scale"
                    >
                      <ArrowUpDown className="w-5 h-5" />
                      <span>Entrada/Saída</span>
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="relative">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Descrição</p>
                      <p className="font-medium">
                        {enhanceProductDescription(material.product.descricao || '', {
                          codigo: material.product.codigo,
                          modelo: material.product.modelo,
                          acabamento: material.product.acabamento,
                          cor: material.product.cor,
                          comprimento: material.product.comprimento
                        }) || material.product.modelo}
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
                  
                  {/* Delete button positioned at bottom right */}
                  {!isReadOnly && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMaterialToDelete(material);
                      }}
                      className="absolute bottom-4 right-4 w-10 h-10 p-0 hover-scale"
                      title="Apagar Material"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
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
