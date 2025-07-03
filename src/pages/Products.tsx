import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Home, LogOut, Search, Package, Users } from 'lucide-react';
import { ProductDialog } from '@/components/warehouse/ProductDialog';
import { FamilyManagementDialog } from '@/components/warehouse/FamilyManagementDialog';
import { Product } from '@/types/warehouse';
import { Input } from '@/components/ui/input';
import EPWLogo from '@/components/ui/epw-logo';

const Products: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const { products, deleteProduct } = useWarehouse();
  const [showDialog, setShowDialog] = useState(false);
  const [showFamilyDialog, setShowFamilyDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Remove authentication check for testing phase
  // useEffect(() => {
  //   if (!isAuthenticated) {
  //     navigate('/login');
  //   }
  // }, [isAuthenticated, navigate]);

  // Remove authentication guard for testing phase
  // if (!isAuthenticated) {
  //   return null;
  // }

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
    <div className="min-h-screen bg-warehouse-bg p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white border-white hover:bg-white hover:text-black order-3 sm:order-1"
          >
            <Home className="w-4 h-4" />
            Home
          </Button>
          
          <div className="flex items-center gap-4 order-1 sm:order-2">
            <EPWLogo size="medium" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Gestão de Produtos
            </h1>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 order-2 sm:order-3 w-full sm:w-auto">
            <Button
              onClick={() => setShowFamilyDialog(true)}
              variant="outline"
              className="flex items-center gap-2 justify-center text-white border-white hover:bg-white hover:text-black"
            >
              <Users className="w-4 h-4" />
              Gestão de Famílias
            </Button>
            <Button
              onClick={() => setShowDialog(true)}
              className="flex items-center gap-2 justify-center"
            >
              <Plus className="w-4 h-4" />
              Novo Produto
            </Button>
            {/* Remove logout button for testing phase */}
            {/* <Button
              variant="destructive"
              onClick={handleLogout}
              className="flex items-center gap-2 justify-center"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button> */}
          </div>
        </div>

        {/* Pesquisa rápida */}
        <div className="mb-6">
          <div className="relative max-w-full sm:max-w-md">
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
                      <table className="w-full min-w-[600px]">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 sm:p-4 font-medium text-sm sm:text-base">Foto</th>
                            <th className="text-left p-3 sm:p-4 font-medium text-sm sm:text-base">Família</th>
                            <th className="text-left p-3 sm:p-4 font-medium text-sm sm:text-base">Modelo</th>
                            <th className="text-left p-3 sm:p-4 font-medium text-sm sm:text-base">Acabamento</th>
                            <th className="text-left p-3 sm:p-4 font-medium text-sm sm:text-base">Cor</th>
                            <th className="text-left p-3 sm:p-4 font-medium text-sm sm:text-base">Comprimento</th>
                            <th className="text-left p-3 sm:p-4 font-medium text-sm sm:text-base">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {modeloProducts.map((product) => (
                            <tr key={product.id} className="border-b hover:bg-muted/50">
                               <td className="p-3 sm:p-4">
                                 {product.foto ? (
                                   <img 
                                     src={product.foto} 
                                     alt={product.modelo}
                                     className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded border"
                                   />
                                 ) : (
                                   <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded border flex items-center justify-center">
                                     <Package className="w-4 h-4 sm:w-6 sm:h-6 text-muted-foreground" />
                                   </div>
                                 )}
                               </td>
                               <td className="p-3 sm:p-4">
                                 <Badge variant="secondary" className="text-xs sm:text-sm">{product.familia}</Badge>
                               </td>
                               <td className="p-3 sm:p-4 font-medium text-sm sm:text-base">{product.modelo}</td>
                              <td className="p-3 sm:p-4">
                                <Badge variant="secondary" className="text-xs sm:text-sm">{product.acabamento}</Badge>
                              </td>
                              <td className="p-3 sm:p-4">
                                <Badge variant="outline" className="text-xs sm:text-sm">{product.cor}</Badge>
                              </td>
                              <td className="p-3 sm:p-4 text-sm sm:text-base">{product.comprimento}mm</td>
                              <td className="p-3 sm:p-4">
                                <div className="flex gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingProduct(product);
                                      setShowDialog(true);
                                    }}
                                  >
                                    <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteProduct(product.id)}
                                  >
                                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
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

        {showFamilyDialog && (
          <FamilyManagementDialog
            onClose={() => setShowFamilyDialog(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Products;