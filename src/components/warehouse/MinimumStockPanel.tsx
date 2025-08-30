import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Search, Package, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useMinimumStocks } from '@/hooks/useMinimumStocks';
import { Product } from '@/types/warehouse';

const MinimumStockPanel = () => {
  const { materials, products } = useWarehouse();
  const {
    minimumStocks,
    addMinimumStock,
    removeMinimumStock,
    getCurrentStock,
    getMinimumStock,
    generateProductKey
  } = useMinimumStocks(materials, products);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [minimumQuantity, setMinimumQuantity] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'with-minimum' | 'without-minimum'>('all');

  // Filter products based on search and status
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const searchLower = searchTerm.toLowerCase();
      return (
        product.modelo.toLowerCase().includes(searchLower) ||
        product.acabamento.toLowerCase().includes(searchLower) ||
        product.cor.toLowerCase().includes(searchLower) ||
        product.comprimento.toString().includes(searchLower)
      );
    });

    if (filterStatus === 'with-minimum') {
      filtered = filtered.filter(product => getMinimumStock(product));
    } else if (filterStatus === 'without-minimum') {
      filtered = filtered.filter(product => !getMinimumStock(product));
    }

    return filtered;
  }, [products, searchTerm, filterStatus, getMinimumStock]);

  const handleAddMinimumStock = () => {
    if (!selectedProduct || !minimumQuantity || parseInt(minimumQuantity) <= 0) return;

    addMinimumStock(selectedProduct, parseInt(minimumQuantity));
    setSelectedProduct(null);
    setMinimumQuantity('');
  };

  const handleRemoveMinimumStock = (product: Product) => {
    const productKey = generateProductKey(product);
    removeMinimumStock(productKey);
  };

  const getStatusBadge = (product: Product) => {
    const currentStock = getCurrentStock(product);
    const minimumStock = getMinimumStock(product);

    if (!minimumStock) {
      return <Badge variant="outline">Não definido</Badge>;
    }

    if (currentStock === 0) {
      return <Badge variant="destructive">Sem stock</Badge>;
    } else if (currentStock < minimumStock.minimumQuantity) {
      return <Badge variant="secondary">Stock baixo</Badge>;
    } else {
      return <Badge variant="default">OK</Badge>;
    }
  };

  const getStatusIcon = (product: Product) => {
    const currentStock = getCurrentStock(product);
    const minimumStock = getMinimumStock(product);

    if (!minimumStock) {
      return <Package className="h-4 w-4 text-muted-foreground" />;
    }

    if (currentStock === 0 || currentStock < minimumStock.minimumQuantity) {
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    } else {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Add new minimum stock */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Definir Stock Mínimo
          </CardTitle>
          <CardDescription>
            Definir quantidade mínima para um produto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Produto</Label>
              <Select 
                value={selectedProduct?.id || ''} 
                onValueChange={(value) => {
                  const product = products.find(p => p.id === value);
                  setSelectedProduct(product || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.modelo} - {product.acabamento} - {product.cor} - {product.comprimento}mm
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantidade Mínima</Label>
              <Input
                type="number"
                min="1"
                placeholder="Ex: 10"
                value={minimumQuantity}
                onChange={(e) => setMinimumQuantity(e.target.value)}
              />
            </div>
          </div>
          <Button 
            onClick={handleAddMinimumStock}
            disabled={!selectedProduct || !minimumQuantity || parseInt(minimumQuantity) <= 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Definir Stock Mínimo
          </Button>
        </CardContent>
      </Card>

      {/* Filter and search */}
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Stocks Mínimos</CardTitle>
          <CardDescription>
            Ver e gerir stocks mínimos definidos ({minimumStocks.length} produtos configurados)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os produtos</SelectItem>
                <SelectItem value="with-minimum">Com stock mínimo</SelectItem>
                <SelectItem value="without-minimum">Sem stock mínimo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Products table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Stock Atual</TableHead>
                  <TableHead>Stock Mínimo</TableHead>
                  <TableHead>Deficit</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map(product => {
                  const currentStock = getCurrentStock(product);
                  const minimumStock = getMinimumStock(product);
                  const deficit = minimumStock ? Math.max(0, minimumStock.minimumQuantity - currentStock) : 0;

                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(product)}
                          {getStatusBadge(product)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.modelo}</div>
                          <div className="text-sm text-muted-foreground">
                            {product.acabamento} - {product.cor} - {product.comprimento}mm
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={currentStock === 0 ? 'text-destructive font-medium' : ''}>
                          {currentStock}
                        </span>
                      </TableCell>
                      <TableCell>
                        {minimumStock ? minimumStock.minimumQuantity : '-'}
                      </TableCell>
                      <TableCell>
                        {deficit > 0 && (
                          <span className="text-destructive font-medium">
                            {deficit}
                          </span>
                        )}
                        {deficit === 0 && minimumStock && (
                          <span className="text-green-600">-</span>
                        )}
                        {!minimumStock && '-'}
                      </TableCell>
                      <TableCell>
                        {minimumStock && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMinimumStock(product)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum produto encontrado com os filtros aplicados
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MinimumStockPanel;