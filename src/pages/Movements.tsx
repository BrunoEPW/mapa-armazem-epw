import React, { useState, useMemo, useRef } from 'react';
import { ArrowUpDown, Search, ArrowLeft, Package, Calendar, Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useApiProducts } from '@/hooks/useApiProducts';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import Header from '@/components/Header';
import Footer from '@/components/ui/Footer';
import { ModeloSelect, ModeloSelectRef } from '@/components/warehouse/ModeloSelect';
import { ComprimentoSelect, ComprimentoSelectRef } from '@/components/warehouse/ComprimentoSelect';
import { CorSelect, CorSelectRef } from '@/components/warehouse/CorSelect';
import movementsBanner from '@/assets/movements-banner.jpg';

const Movements = () => {
  const navigate = useNavigate();
  const { movements, materials } = useWarehouse();
  const { apiProducts, loading: apiLoading } = useApiProducts();
  
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'entrada' | 'saida'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'material' | 'type' | 'quantity'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Product filters (like in Products page)
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [selectedComprimento, setSelectedComprimento] = useState<string>('all');
  const [selectedCor, setSelectedCor] = useState<string>('all');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  
  const modeloSelectRef = useRef<ModeloSelectRef>(null);
  const comprimentoSelectRef = useRef<ComprimentoSelectRef>(null);
  const corSelectRef = useRef<CorSelectRef>(null);

  // Debug logs
  console.log('🔍 [Movements Debug] Total movements:', movements.length);
  console.log('🔍 [Movements Debug] Total materials:', materials.length);
  console.log('🔍 [Movements Debug] Filter values:', { 
    selectedModel, 
    selectedComprimento, 
    selectedCor, 
    productSearchQuery, 
    searchFilter, 
    typeFilter 
  });

  // Filter and sort movements
  const filteredMovements = useMemo(() => {
    return movements
      .map(movement => {
        // Find the material to get additional info
        const material = materials.find(m => m.id === movement.materialId);
        return {
          ...movement,
          material: material || null,
          materialCode: material?.product?.codigo || material?.product?.modelo || 'N/A',
          materialDescription: material?.product?.descricao || 
            (material ? `${material.product.modelo} ${material.product.acabamento} ${material.product.cor}` : 'Material não encontrado'),
          location: material ? `${material.location.estante}${material.location.prateleira}` : 'N/A'
        };
      })
      .filter(movement => {
        console.log('🔍 [Filter Debug] Processing movement:', {
          id: movement.id,
          material: movement.material,
          materialCode: movement.materialCode,
          product: movement.material?.product
        });

        // Filter by search term (material code, description, or norc)
        const searchMatch = searchFilter === '' || 
          movement.materialCode.toLowerCase().includes(searchFilter.toLowerCase()) ||
          movement.materialDescription.toLowerCase().includes(searchFilter.toLowerCase()) ||
          (movement.norc && movement.norc.toLowerCase().includes(searchFilter.toLowerCase()));
        
        // Filter by movement type
        const typeMatch = typeFilter === 'all' || movement.type === typeFilter;
        
        // Product filters (using EPW decoded fields)
        console.log('🔍 [Model Debug] Comparing selectedModel:', selectedModel, 'with epwModelo:', movement.material?.product?.epwModelo);
        const modelMatch = selectedModel === 'all' || 
          (movement.material?.product?.epwModelo?.l === selectedModel) ||
          (movement.material?.product?.epwModelo?.d === selectedModel);
        
        const comprimentoMatch = selectedComprimento === 'all' || 
          (movement.material?.product?.epwComprimento?.l === selectedComprimento);
        
        const corMatch = selectedCor === 'all' || 
          (movement.material?.product?.epwCor?.l === selectedCor);
        
        const productSearchMatch = productSearchQuery === '' ||
          (movement.material?.product?.descricao && 
           movement.material.product.descricao.toLowerCase().includes(productSearchQuery.toLowerCase())) ||
          (movement.material?.product?.codigo && 
           movement.material.product.codigo.toLowerCase().includes(productSearchQuery.toLowerCase()));
        
        const finalMatch = searchMatch && typeMatch && modelMatch && comprimentoMatch && corMatch && productSearchMatch;
        
        console.log('🔍 [Filter Debug] Filter results:', {
          searchMatch,
          typeMatch,
          modelMatch,
          comprimentoMatch,
          corMatch,
          productSearchMatch,
          finalMatch
        });
        
        return finalMatch;
      })
      .sort((a, b) => {
        let compareValue = 0;
        
        switch (sortBy) {
          case 'date':
            compareValue = new Date(a.date).getTime() - new Date(b.date).getTime();
            break;
          case 'material':
            compareValue = a.materialCode.localeCompare(b.materialCode);
            break;
          case 'type':
            compareValue = a.type.localeCompare(b.type);
            break;
          case 'quantity':
            compareValue = a.pecas - b.pecas;
            break;
        }
        
        return sortOrder === 'asc' ? compareValue : -compareValue;
      });
  }, [movements, materials, searchFilter, typeFilter, sortBy, sortOrder, selectedModel, selectedComprimento, selectedCor, productSearchQuery]);

  // Filter API products based on same criteria
  const filteredApiProducts = useMemo(() => {
    return apiProducts.filter(product => {
      const modelMatch = selectedModel === 'all' || 
        (product.epwModelo?.l === selectedModel);
      
      const comprimentoMatch = selectedComprimento === 'all' || 
        (product.epwComprimento?.l === selectedComprimento);
      
      const corMatch = selectedCor === 'all' || 
        (product.epwCor?.l === selectedCor);
      
      const productSearchMatch = productSearchQuery === '' ||
        (product.descricao && 
         product.descricao.toLowerCase().includes(productSearchQuery.toLowerCase())) ||
        (product.codigo && 
         product.codigo.toLowerCase().includes(productSearchQuery.toLowerCase()));
      
      return modelMatch && comprimentoMatch && corMatch && productSearchMatch;
    });
  }, [apiProducts, selectedModel, selectedComprimento, selectedCor, productSearchQuery]);

  // Check which products have movements
  const productsWithMovements = useMemo(() => {
    const productIds = new Set();
    materials.forEach(material => {
      const hasMovements = movements.some(movement => movement.materialId === material.id);
      if (hasMovements) {
        productIds.add(material.product.codigo || material.product.modelo);
      }
    });
    return productIds;
  }, [materials, movements]);

  const totalEntradas = movements.filter(m => m.type === 'entrada').reduce((sum, m) => sum + m.pecas, 0);
  const totalSaidas = movements.filter(m => m.type === 'saida').reduce((sum, m) => sum + m.pecas, 0);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'date' ? 'desc' : 'asc');
    }
  };

  const getMovementTypeBadge = (type: string) => {
    return (
      <Badge variant={type === 'entrada' ? 'default' : 'destructive'}>
        {type === 'entrada' ? 'Entrada' : 'Saída'}
      </Badge>
    );
  };

  const clearAllFilters = () => {
    setSearchFilter('');
    setTypeFilter('all');
    setSelectedModel('all');
    setSelectedComprimento('all');
    setSelectedCor('all');
    setProductSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="p-4 sm:p-6 lg:p-8 relative flex-1">
        <div className="w-full">
          {/* Hero Banner */}
          <div className="flex flex-col items-center mb-6 sm:mb-8">
            <button
              onClick={() => navigate('/')}
              className="relative w-full transition-all duration-500 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-lg animate-fade-in"
            >
              <img 
                src={movementsBanner} 
                alt="Movements Banner" 
                className="w-full h-48 sm:h-64 lg:h-80 object-cover rounded-xl shadow-2xl transition-all duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/80 rounded-xl flex items-center justify-center px-6 sm:px-8 lg:px-12">
                <div className="text-center">
                  <h1 className="text-3xl sm:text-4xl lg:text-6xl font-black text-white tracking-wider drop-shadow-2xl mb-2">
                    MOVIMENTOS
                  </h1>
                  <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-orange-400 tracking-wide drop-shadow-2xl">
                    Histórico de Entradas e Saídas
                  </h2>
                </div>
              </div>
            </button>
          </div>

          <div className="max-w-7xl mx-auto">
            {/* Back Button */}
            <div className="flex items-center mb-6">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors duration-200 p-2 rounded-lg hover:bg-white/10"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Voltar</span>
              </button>
            </div>


            {/* Movements Table */}
            <Card className="bg-card/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpDown className="h-5 w-5" />
                  Lista de Movimentos
                </CardTitle>
                
                {/* Product Filters (like in Products page) */}
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
                
                {/* Basic Filters */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar por NORC, material ou descrição..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="entrada">Entradas</SelectItem>
                        <SelectItem value="saida">Saídas</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button 
                      onClick={clearAllFilters}
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Limpar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="overflow-auto max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('date')}
                        >
                          Data {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('type')}
                        >
                          Tipo {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Localização</TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50 text-right"
                          onClick={() => handleSort('quantity')}
                        >
                          Quantidade {sortBy === 'quantity' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead>NORC</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMovements.length > 0 ? (
                        filteredMovements.map((movement) => (
                          <TableRow key={movement.id}>
                            <TableCell className="font-medium">
                              {format(new Date(movement.date), 'dd/MM/yyyy HH:mm', { locale: pt })}
                            </TableCell>
                            <TableCell>
                              {getMovementTypeBadge(movement.type)}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {movement.materialDescription}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{movement.location}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              {movement.pecas}
                            </TableCell>
                            <TableCell>
                              {movement.norc || '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            {searchFilter || typeFilter !== 'all' ? 
                              'Nenhum movimento encontrado com os filtros aplicados' : 
                              'Nenhum movimento registrado'
                            }
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Filtered Products List */}
            {filteredApiProducts.length > 0 && (
              <Card className="bg-card/80 backdrop-blur mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Produtos Filtrados ({filteredApiProducts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-auto">
                    {filteredApiProducts.map((product) => {
                      const hasMovements = productsWithMovements.has(product.codigo || product.modelo);
                      return (
                        <div
                          key={product.id}
                          className={`p-4 rounded-lg border ${
                            hasMovements 
                              ? 'bg-orange-100 border-orange-300 dark:bg-orange-900/20 dark:border-orange-700' 
                              : 'bg-background border-border'
                          } transition-colors duration-200`}
                        >
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">
                                {product.codigo || product.modelo}
                              </span>
                              {hasMovements && (
                                <Badge variant="default" className="bg-orange-500 text-white">
                                  Com Movimentos
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {product.descricao || product.acabamento}
                            </p>
                            {product.epwModelo && (
                              <div className="flex flex-wrap gap-1 text-xs">
                                <Badge variant="outline" className="text-xs">
                                  Modelo: {product.epwModelo.d}
                                </Badge>
                                {product.epwComprimento && (
                                  <Badge variant="outline" className="text-xs">
                                    {product.epwComprimento.d}
                                  </Badge>
                                )}
                                {product.epwCor && (
                                  <Badge variant="outline" className="text-xs">
                                    {product.epwCor.d}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Movements;