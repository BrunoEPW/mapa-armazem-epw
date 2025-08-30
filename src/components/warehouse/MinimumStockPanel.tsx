import React, { useState, useMemo, useRef } from 'react';
import { Plus, Trash2, Search, Package, AlertTriangle, CheckCircle, Edit } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useMinimumStocks } from '@/hooks/useMinimumStocks';
import { Product } from '@/types/warehouse';
import { ModeloSelect, ModeloSelectRef } from '@/components/warehouse/ModeloSelect';
import { ComprimentoSelect, ComprimentoSelectRef } from '@/components/warehouse/ComprimentoSelect';
import { CorSelect, CorSelectRef } from '@/components/warehouse/CorSelect';

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

  console.log('🔍 [MinimumStockPanel] Data:', { 
    materialsCount: materials.length, 
    productsCount: products.length, 
    minimumStocksCount: minimumStocks.length 
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [minimumQuantity, setMinimumQuantity] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'with-minimum' | 'without-minimum'>('all');
  
  // Product filters (like in other tabs)
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [selectedComprimento, setSelectedComprimento] = useState<string>('all');
  const [selectedCor, setSelectedCor] = useState<string>('all');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  
  // Dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>('');
  
  const modeloSelectRef = useRef<ModeloSelectRef>(null);
  const comprimentoSelectRef = useRef<ComprimentoSelectRef>(null);
  const corSelectRef = useRef<CorSelectRef>(null);

  // Filter products based on search and filters
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      // Basic search
      const searchLower = searchTerm.toLowerCase();
      const searchMatch = searchTerm === '' || 
        product.modelo.toLowerCase().includes(searchLower) ||
        product.acabamento.toLowerCase().includes(searchLower) ||
        product.cor.toLowerCase().includes(searchLower) ||
        product.comprimento.toString().includes(searchLower) ||
        (product.descricao && product.descricao.toLowerCase().includes(searchLower));

      // Product description search
      const productSearchMatch = productSearchQuery === '' ||
        (product.descricao && product.descricao.toLowerCase().includes(productSearchQuery.toLowerCase())) ||
        (product.codigo && product.codigo.toLowerCase().includes(productSearchQuery.toLowerCase()));

      // Model filter (using EPW decoded fields)
      const modelMatch = selectedModel === 'all' || 
        (product.epwModelo?.l === selectedModel) ||
        (product.epwModelo?.d === selectedModel);
      
      const comprimentoMatch = selectedComprimento === 'all' || 
        (product.epwComprimento?.l === selectedComprimento) ||
        (product.epwComprimento?.d === selectedComprimento);
      
      const corMatch = selectedCor === 'all' || 
        (product.epwCor?.l === selectedCor) ||
        (product.epwCor?.d === selectedCor);

      return searchMatch && productSearchMatch && modelMatch && comprimentoMatch && corMatch;
    });

    // Status filter
    if (filterStatus === 'with-minimum') {
      filtered = filtered.filter(product => getMinimumStock(product));
    } else if (filterStatus === 'without-minimum') {
      filtered = filtered.filter(product => !getMinimumStock(product));
    }

    return filtered;
  }, [products, searchTerm, productSearchQuery, selectedModel, selectedComprimento, selectedCor, filterStatus, getMinimumStock]);

  const handleAddMinimumStock = () => {
    if (!selectedProduct || !minimumQuantity || parseInt(minimumQuantity) <= 0) return;

    addMinimumStock(selectedProduct, parseInt(minimumQuantity));
    setSelectedProduct(null);
    setMinimumQuantity('');
  };

  const handleEditProduct = (product: Product) => {
    const existingMinimum = getMinimumStock(product);
    setEditingProduct(product);
    setEditQuantity(existingMinimum ? existingMinimum.minimumQuantity.toString() : '');
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingProduct || !editQuantity || parseInt(editQuantity) <= 0) return;

    addMinimumStock(editingProduct, parseInt(editQuantity));
    setEditDialogOpen(false);
    setEditingProduct(null);
    setEditQuantity('');
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setProductSearchQuery('');
    setSelectedModel('all');
    setSelectedComprimento('all');
    setSelectedCor('all');
    setFilterStatus('all');
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
                      {product.descricao || `${product.modelo} - ${product.acabamento} - ${product.cor} - ${product.comprimento}mm`}
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
          {/* Product Filters (like in other tabs) */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ModeloSelect
                ref={modeloSelectRef}
                value={selectedModel}
                onValueChange={setSelectedModel}
              />
              <ComprimentoSelect
                ref={comprimentoSelectRef}
                value={selectedComprimento}
                onValueChange={setSelectedComprimento}
              />
              <CorSelect
                ref={corSelectRef}
                value={selectedCor}
                onValueChange={setSelectedCor}
              />
            </div>
            
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por descrição de produto..."
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

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
            <Button onClick={clearAllFilters} variant="outline" size="sm">
              Limpar Filtros
            </Button>
          </div>

          {/* Products table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição do Artigo</TableHead>
                  <TableHead>Stock Atual</TableHead>
                  <TableHead>Stock Mínimo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map(product => {
                  const currentStock = getCurrentStock(product);
                  const minimumStock = getMinimumStock(product);
                  const isLowStock = minimumStock && currentStock < minimumStock.minimumQuantity;

                  return (
                    <TableRow 
                      key={product.id}
                      className={`cursor-pointer hover:bg-muted/50 ${isLowStock ? 'bg-orange-100 hover:bg-orange-200' : ''}`}
                      onClick={() => handleEditProduct(product)}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {product.descricao || `${product.modelo} - ${product.acabamento} - ${product.cor} - ${product.comprimento}mm`}
                          </div>
                          {product.codigo && (
                            <div className="text-sm text-muted-foreground">
                              Código: {product.codigo}
                            </div>
                          )}
                          {!product.descricao && (
                            <div className="text-xs text-muted-foreground">
                              Modelo: {product.modelo} | Acabamento: {product.acabamento} | Cor: {product.cor} | {product.comprimento}mm
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={currentStock === 0 ? 'text-destructive font-medium' : isLowStock ? 'text-orange-600 font-medium' : ''}>
                          {currentStock}
                        </span>
                      </TableCell>
                      <TableCell>
                        {minimumStock ? minimumStock.minimumQuantity : '-'}
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Definir Stock Mínimo
            </DialogTitle>
            <DialogDescription>
              Defina a quantidade mínima para este produto
            </DialogDescription>
          </DialogHeader>
          
          {editingProduct && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-medium">Produto</Label>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="font-medium">
                    {editingProduct.descricao || `${editingProduct.modelo} - ${editingProduct.acabamento} - ${editingProduct.cor} - ${editingProduct.comprimento}mm`}
                  </div>
                  {editingProduct.codigo && (
                    <div className="text-sm text-muted-foreground">
                      Código: {editingProduct.codigo}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-quantity">Quantidade Mínima</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min="1"
                  placeholder="Ex: 10"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSaveEdit}
                  disabled={!editQuantity || parseInt(editQuantity) <= 0}
                >
                  Guardar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MinimumStockPanel;