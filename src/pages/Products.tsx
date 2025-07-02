import React, { useState } from 'react';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { Product } from '@/types/warehouse';
import { ProductDialog } from '@/components/warehouse/ProductDialog';

const Products = () => {
  const navigate = useNavigate();
  const { products, deleteProduct } = useWarehouse();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Tem certeza que deseja eliminar este produto? Isto também removerá todos os materiais relacionados.')) {
      deleteProduct(productId);
    }
  };

  return (
    <div className="min-h-screen bg-warehouse-bg p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Mapa
          </Button>
          
          <h1 className="text-3xl font-bold text-foreground">
            Gestão de Produtos
          </h1>
          
          <Button
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Produto
          </Button>
        </div>

        {products.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground text-lg mb-4">
                Nenhum produto cadastrado
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Produto
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{product.modelo}</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingProduct(product)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Acabamento</p>
                      <p className="font-medium">{product.acabamento}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cor</p>
                      <p className="font-medium">{product.cor}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Comprimento</p>
                      <p className="font-medium">{product.comprimento}mm</p>
                    </div>
                    {product.foto && (
                      <div>
                        <p className="text-sm text-muted-foreground">Foto</p>
                        <img
                          src={product.foto}
                          alt={product.modelo}
                          className="w-full h-32 object-cover rounded-md mt-2"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {showAddDialog && (
          <ProductDialog onClose={() => setShowAddDialog(false)} />
        )}

        {editingProduct && (
          <ProductDialog
            product={editingProduct}
            onClose={() => setEditingProduct(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Products;