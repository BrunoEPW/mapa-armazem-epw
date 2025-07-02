import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Home, LogOut, Search, Package } from 'lucide-react';
import { ProductDialog } from '@/components/warehouse/ProductDialog';
import { Product } from '@/types/warehouse';
import { Input } from '@/components/ui/input';

const Products: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const { products, deleteProduct } = useWarehouse();
  const [showDialog, setShowDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Tem certeza que deseja eliminar este produto? Isto também removerá todos os materiais relacionados.')) {
      deleteProduct(productId);
    }
  };

  const filteredProducts = products
    .filter(product => 
      product.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.acabamento.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.cor.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.modelo.localeCompare(b.modelo));

  const groupedProducts = filteredProducts.reduce((acc, product) => {
    const modelo = product.modelo;
    if (!acc[modelo]) {
      acc[modelo] = [];
    }
    acc[modelo].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <div className="min-h-screen bg-warehouse-bg p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white border-white hover:bg-white hover:text-black"
          >
            <Home className="w-4 h-4" />
            Home
          </Button>
          
          <h1 className="text-3xl font-bold text-white">
            Gestão de Produtos
          </h1>
          
          <div className="flex gap-2">
            <Button
              onClick={() => setShowDialog(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo Produto
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Pesquisa rápida */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por modelo, acabamento ou cor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {Object.keys(groupedProducts).length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground text-lg mb-4">
                Nenhum produto encontrado
              </p>
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Produto
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedProducts).map(([modelo, modeloProducts]) => (
              <div key={modelo}>
                <h2 className="text-xl font-semibold text-white mb-3">{modelo}</h2>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-4 font-medium">Foto</th>
                            <th className="text-left p-4 font-medium">Modelo</th>
                            <th className="text-left p-4 font-medium">Acabamento</th>
                            <th className="text-left p-4 font-medium">Cor</th>
                            <th className="text-left p-4 font-medium">Comprimento</th>
                            <th className="text-left p-4 font-medium">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {modeloProducts.map((product) => (
                            <tr key={product.id} className="border-b hover:bg-muted/50">
                              <td className="p-4">
                                {product.foto ? (
                                  <img 
                                    src={product.foto} 
                                    alt={product.modelo}
                                    className="w-16 h-16 object-cover rounded border"
                                  />
                                ) : (
                                  <div className="w-16 h-16 bg-muted rounded border flex items-center justify-center">
                                    <Package className="w-6 h-6 text-muted-foreground" />
                                  </div>
                                )}
                              </td>
                              <td className="p-4 font-medium">{product.modelo}</td>
                              <td className="p-4">
                                <Badge variant="secondary">{product.acabamento}</Badge>
                              </td>
                              <td className="p-4">
                                <Badge variant="outline">{product.cor}</Badge>
                              </td>
                              <td className="p-4">{product.comprimento}mm</td>
                              <td className="p-4">
                                <div className="flex gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingProduct(product);
                                      setShowDialog(true);
                                    }}
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
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}

        {showDialog && (
          <ProductDialog
            product={editingProduct}
            onClose={() => {
              setShowDialog(false);
              setEditingProduct(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Products;