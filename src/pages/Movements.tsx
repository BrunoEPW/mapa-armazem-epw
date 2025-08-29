import React, { useState, useMemo } from 'react';
import { ArrowUpDown, Search, ArrowLeft, Package, Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import Header from '@/components/Header';
import Footer from '@/components/ui/Footer';
import movementsBanner from '@/assets/movements-banner.jpg';

const Movements = () => {
  const navigate = useNavigate();
  const { movements, materials } = useWarehouse();
  
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'entrada' | 'saida'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'material' | 'type' | 'quantity'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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
        // Filter by search term (material code, description, or norc)
        const searchMatch = searchFilter === '' || 
          movement.materialCode.toLowerCase().includes(searchFilter.toLowerCase()) ||
          movement.materialDescription.toLowerCase().includes(searchFilter.toLowerCase()) ||
          (movement.norc && movement.norc.toLowerCase().includes(searchFilter.toLowerCase()));
        
        // Filter by movement type
        const typeMatch = typeFilter === 'all' || movement.type === typeFilter;
        
        return searchMatch && typeMatch;
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
  }, [movements, materials, searchFilter, typeFilter, sortBy, sortOrder]);

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
                  <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-blue-400 tracking-wide drop-shadow-2xl">
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

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-card/80 backdrop-blur">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Movimentos</p>
                      <p className="text-2xl font-bold">{movements.length}</p>
                    </div>
                    <ArrowUpDown className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/80 backdrop-blur">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Entradas</p>
                      <p className="text-2xl font-bold text-green-600">{totalEntradas}</p>
                    </div>
                    <Package className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/80 backdrop-blur">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Saídas</p>
                      <p className="text-2xl font-bold text-red-600">{totalSaidas}</p>
                    </div>
                    <Package className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Movements Table */}
            <Card className="bg-card/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpDown className="h-5 w-5" />
                  Lista de Movimentos
                </CardTitle>
                
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar por material ou NORC..."
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
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('material')}
                        >
                          Material {sortBy === 'material' && (sortOrder === 'asc' ? '↑' : '↓')}
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
                            <TableCell className="font-medium">
                              {movement.materialCode}
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
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Movements;