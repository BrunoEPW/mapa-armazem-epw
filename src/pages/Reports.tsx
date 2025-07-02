import React from 'react';
import { Home, TrendingUp, Package, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useWarehouse } from '@/contexts/WarehouseContext';

const Reports = () => {
  const navigate = useNavigate();
  const { materials, movements, products } = useWarehouse();

  // Calculate statistics
  const totalMaterials = materials.length;
  const totalPecas = materials.reduce((sum, m) => sum + m.pecas, 0);
  const totalMovements = movements.length;
  const totalProducts = products.length;

  // Recent movements
  const recentMovements = movements
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Materials by shelf
  const materialsByShelf = materials.reduce((acc, material) => {
    const key = `${material.location.estante}${material.location.prateleira}`;
    if (!acc[key]) {
      acc[key] = { location: material.location, materials: [], totalPecas: 0 };
    }
    acc[key].materials.push(material);
    acc[key].totalPecas += material.pecas;
    return acc;
  }, {} as Record<string, any>);

  return (
    <div className="min-h-screen bg-warehouse-bg p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white border-white hover:bg-white hover:text-black order-2 sm:order-1"
          >
            <Home className="w-4 h-4" />
            Home
          </Button>
          
          <h1 className="text-2xl sm:text-3xl font-bold text-white order-1 sm:order-2">
            Relatórios Inteligentes
          </h1>
          
          <div className="hidden sm:block order-3"></div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/80 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Materiais</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMaterials}</div>
              <p className="text-xs text-muted-foreground">
                Tipos de materiais diferentes
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Peças</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPecas}</div>
              <p className="text-xs text-muted-foreground">
                Peças em stock
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Movimentações</CardTitle>
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMovements}</div>
              <p className="text-xs text-muted-foreground">
                Entradas e saídas registadas
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produtos Cadastrados</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                Fichas de produtos criadas
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Movements */}
          <Card className="bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Movimentações Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentMovements.length > 0 ? (
                  recentMovements.map((movement) => {
                    const material = materials.find(m => m.id === movement.materialId);
                    return (
                      <div key={movement.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">
                            {material?.product?.modelo || 'Material não encontrado'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {movement.type === 'entrada' ? 'Entrada' : 'Saída'} - {movement.pecas} peças
                          </p>
                          <p className="text-xs text-muted-foreground">
                            NORC: {movement.norc}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">{movement.date}</p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            movement.type === 'entrada' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {movement.type === 'entrada' ? '+' : '-'}{movement.pecas}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma movimentação registada ainda
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stock by Shelf */}
          <Card className="bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Stock por Prateleira</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {Object.values(materialsByShelf).length > 0 ? (
                  Object.values(materialsByShelf)
                    .sort((a: any, b: any) => a.location.estante.localeCompare(b.location.estante) || a.location.prateleira - b.location.prateleira)
                    .map((shelf: any) => (
                      <div key={`${shelf.location.estante}${shelf.location.prateleira}`} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">
                            Prateleira {shelf.location.estante}{shelf.location.prateleira}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {shelf.materials.length} tipos de materiais
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{shelf.totalPecas}</p>
                          <p className="text-xs text-muted-foreground">peças</p>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum material em stock
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Reports;