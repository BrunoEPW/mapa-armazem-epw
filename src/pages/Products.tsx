import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useCombinedProducts } from '@/hooks/useCombinedProducts';
import { useProductSearch } from '@/hooks/useProductSearch';
import { Button } from '@/components/ui/button';
import { SyncStatusIndicator } from '@/components/warehouse/SyncStatusIndicator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Home, LogOut, Search, Package, Users, Database, Wifi, Loader2 } from 'lucide-react';
import { ProductDialog } from '@/components/warehouse/ProductDialog';
import { FamilyManagementDialog } from '@/components/warehouse/FamilyManagementDialog';
import { DatabaseResetDialog } from '@/components/warehouse/DatabaseResetDialog';
import { Product } from '@/types/warehouse';
import { CombinedProduct } from '@/hooks/useCombinedProducts';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EPWLogo from '@/components/ui/epw-logo';

const Products: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, signOut, user, hasPermission } = useAuth();
  const { products, deleteProduct } = useWarehouse();
  const { combinedProducts, localCount, apiCount, loading, error, refresh } = useCombinedProducts(products);
  const {
    searchQuery,
    setSearchQuery,
    selectedSource,
    setSelectedSource,
    filteredProducts,
  } = useProductSearch(combinedProducts);
  const [showDialog, setShowDialog] = useState(false);
  const [showFamilyDialog, setShowFamilyDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Tem certeza que deseja eliminar este produto? Isto também removerá todos os materiais relacionados.')) {
      deleteProduct(productId);
    }
  };

  // Group products by modelo
  const groupedProducts: Record<string, CombinedProduct[]> = {};
  filteredProducts.forEach(product => {
    const modelo = product.modelo;
    if (!groupedProducts[modelo]) {
      groupedProducts[modelo] = [];
    }
    groupedProducts[modelo].push(product);
  });

  return (
    <div className="min-h-screen bg-warehouse-bg p-4 sm:p-6 lg:p-8">
      {/* Debug Console */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
          <h3 className="text-white font-bold mb-2">🐛 DEBUG CONSOLE</h3>
          <div className="space-y-1">
            <div><span className="text-yellow-400">Local Products:</span> {products.length}</div>
            <div><span className="text-yellow-400">Combined Products:</span> {combinedProducts.length}</div>
            <div><span className="text-yellow-400">Filtered Products:</span> {filteredProducts.length}</div>
            <div><span className="text-yellow-400">Local Count:</span> {localCount}</div>
            <div><span className="text-yellow-400">API Count:</span> {apiCount}</div>
            <div><span className="text-yellow-400">Loading:</span> {loading ? 'true' : 'false'}</div>
            <div><span className="text-yellow-400">Error:</span> {error || 'none'}</div>
            <div><span className="text-yellow-400">Selected Source:</span> {selectedSource}</div>
            <div><span className="text-yellow-400">Search Query:</span> "{searchQuery}"</div>
            {combinedProducts.length > 0 && (
              <div>
                <span className="text-yellow-400">Sample Combined Product:</span>
                <pre className="text-xs mt-1 text-gray-300 overflow-auto max-h-32">
                  {JSON.stringify(combinedProducts[0], null, 2)}
                </pre>
              </div>
            )}
            {error && (
              <div className="text-red-400 mt-2">
                <span className="text-yellow-400">Full Error Details:</span>
                <div className="whitespace-pre-wrap">{error}</div>
              </div>
            )}
          </div>
        </div>
      </div>

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
          
          
          <div className="flex flex-col items-center order-1 sm:order-2">
            <img 
              src="/lovable-uploads/ce6ad3d6-6728-414c-b327-428c5cd38f81.png" 
              alt="EPW Logo" 
              className="h-16 sm:h-20 lg:h-24 drop-shadow-lg mb-4"
            />
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-wider">
              PRODUTOS
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
            {hasPermission('canManageUsers') && (
              <Button
                onClick={() => setShowResetDialog(true)}
                variant="destructive"
                className="flex items-center gap-2 justify-center"
              >
                <Database className="w-4 h-4" />
                Limpar BD
              </Button>
            )}
            <Button
              onClick={() => setShowDialog(true)}
              className="flex items-center gap-2 justify-center"
            >
              <Plus className="w-4 h-4" />
              Novo Produto
            </Button>
          </div>
        </div>

        {/* Contadores e status da API */}
        <div className="mb-6 space-y-4">
          
          {/* Contadores e status da API */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-white text-sm">
                <span className="font-medium">{localCount}</span> produtos locais
              </div>
              <div className="text-white text-sm flex items-center gap-1">
                <Wifi className="w-4 h-4" />
                <span className="font-medium">{apiCount}</span> produtos da API
                {loading && <Loader2 className="w-4 h-4 animate-spin ml-1" />}
              </div>
              {error && (
                <div className="text-destructive text-sm">
                  Erro: {error}
                </div>
              )}
            </div>
            
            <Button
              onClick={refresh}
              variant="outline"
              size="sm"
              disabled={loading}
              className="text-white border-white hover:bg-white hover:text-black"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh API'}
            </Button>
          </div>
          
          {/* Filtros e pesquisa */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por modelo, acabamento ou cor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedSource} onValueChange={(value) => setSelectedSource(value as "all" | "local" | "api")}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os produtos</SelectItem>
                <SelectItem value="local">Apenas locais</SelectItem>
                <SelectItem value="api">Apenas da API</SelectItem>
              </SelectContent>
            </Select>
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
                             <th className="text-left p-3 sm:p-4 font-medium text-sm sm:text-base">Origem</th>
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
                                 <Badge 
                                   variant={product.source === 'api' ? 'default' : 'secondary'}
                                   className="text-xs sm:text-sm flex items-center gap-1"
                                 >
                                   {product.source === 'api' ? (
                                     <>
                                       <Wifi className="w-3 h-3" />
                                       API
                                     </>
                                   ) : (
                                     'Local'
                                   )}
                                 </Badge>
                               </td>
                               <td className="p-3 sm:p-4">
                                 <div className="flex gap-1">
                                   {product.source === 'local' && (
                                     <>
                                       <Button
                                         variant="outline"
                                         size="sm"
                                         onClick={() => {
                                           setEditingProduct(product as Product);
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
                                     </>
                                   )}
                                   {product.source === 'api' && (
                                     <div className="text-xs text-muted-foreground">
                                       Produto da API
                                     </div>
                                   )}
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

        {showResetDialog && (
          <DatabaseResetDialog
            open={showResetDialog}
            onClose={() => setShowResetDialog(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Products;