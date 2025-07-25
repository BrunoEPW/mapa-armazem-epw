import React, { useState } from 'react';
import { TrendingUp, Package, ArrowUpDown, Calendar as CalendarIcon, Search, Download } from 'lucide-react';
import reportsBanner from '@/assets/reports-banner.jpg';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import EPWLogo from '@/components/ui/epw-logo';

const Reports = () => {
  const navigate = useNavigate();
  const { materials, movements, products } = useWarehouse();
  
  // State for date selection and filters
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchFilter, setSearchFilter] = useState('');
  const [exportType, setExportType] = useState<'modelo' | 'familia'>('modelo');

  // Calculate statistics
  const totalMaterials = materials.length;
  const totalPecas = materials.reduce((sum, m) => sum + m.pecas, 0);
  const totalMovements = movements.length;
  const totalProducts = products.length;

  // Recent movements
  const recentMovements = movements
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Calculate historical stock for selected date
  const calculateHistoricalStock = (date: Date) => {
    const targetDate = format(date, 'yyyy-MM-dd');
    const historicalMaterials = new Map();

    // Start with all current materials
    materials.forEach(material => {
      const key = `${material.product.modelo}-${material.product.acabamento}-${material.product.cor}-${material.product.comprimento}`;
      historicalMaterials.set(key, {
        product: material.product,
        totalPecas: 0,
        locations: new Set()
      });
    });

    // Apply movements up to the selected date
    movements
      .filter(movement => movement.date <= targetDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach(movement => {
        const material = materials.find(m => m.id === movement.materialId);
        if (material) {
          const key = `${material.product.modelo}-${material.product.acabamento}-${material.product.cor}-${material.product.comprimento}`;
          const existing = historicalMaterials.get(key);
          if (existing) {
            if (movement.type === 'entrada') {
              existing.totalPecas += movement.pecas;
            } else {
              existing.totalPecas -= movement.pecas;
            }
            existing.locations.add(`${material.location.estante}${material.location.prateleira}`);
          }
        }
      });

    return Array.from(historicalMaterials.values()).filter(item => item.totalPecas > 0);
  };

  // Group materials by product
  const groupedProducts = () => {
    const grouped = new Map();
    
    materials.forEach(material => {
      const key = `${material.product.modelo}-${material.product.acabamento}-${material.product.cor}-${material.product.comprimento}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          product: material.product,
          totalPecas: 0,
          locations: new Set()
        });
      }
      const existing = grouped.get(key);
      existing.totalPecas += material.pecas;
      existing.locations.add(`${material.location.estante}${material.location.prateleira}`);
    });

    return Array.from(grouped.values())
      .filter(item => 
        searchFilter === '' || 
        item.product.modelo.toLowerCase().includes(searchFilter.toLowerCase())
      )
      .sort((a, b) => b.totalPecas - a.totalPecas);
  };

  const historicalStock = calculateHistoricalStock(selectedDate);
  const productStock = groupedProducts();

  // Export functions
  const exportToExcel = (type: 'current' | 'historical') => {
    const data = type === 'current' ? productStock : historicalStock;
    
    let exportData;
    let filename;
    
    if (exportType === 'familia') {
      // Group by family
      const familyGroups = new Map();
      data.forEach(item => {
        const familia = item.product.familia;
        if (!familyGroups.has(familia)) {
          familyGroups.set(familia, {
            familia,
            totalPecas: 0,
            modelos: new Set()
          });
        }
        const group = familyGroups.get(familia);
        group.totalPecas += item.totalPecas;
        group.modelos.add(item.product.modelo);
      });
      
      exportData = Array.from(familyGroups.values()).map(group => ({
        'Família': group.familia,
        'Total de Peças': group.totalPecas,
        'Modelos': Array.from(group.modelos).join(', ')
      }));
      filename = `relatorio_familias_${format(selectedDate, 'dd-MM-yyyy')}.xlsx`;
    } else {
      // Export by model
      exportData = data.map(item => ({
        'Modelo': item.product.modelo,
        'Acabamento': item.product.acabamento,
        'Cor': item.product.cor,
        'Comprimento (mm)': item.product.comprimento,
        'Família': item.product.familia,
        'Quantidade': item.totalPecas,
        'Localizações': Array.from(item.locations).join(', ')
      }));
      filename = `relatorio_modelos_${format(selectedDate, 'dd-MM-yyyy')}.xlsx`;
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="min-h-screen bg-warehouse-bg p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/')}
            className="relative w-full max-w-2xl transition-all duration-500 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-lg animate-fade-in"
          >
            <img 
              src={reportsBanner} 
              alt="Reports Banner" 
              className="w-full h-32 sm:h-40 object-cover rounded-lg shadow-lg transition-all duration-300"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-wider drop-shadow-lg">
                RELATÓRIOS
              </h1>
            </div>
          </button>
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

        {/* Stock por Produto */}
        <div className="mb-6">
          <Card className="bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Stock por Produto
              </CardTitle>
              <div className="flex items-center gap-4 justify-between">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar por modelo..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Select value={exportType} onValueChange={(value: 'modelo' | 'familia') => setExportType(value)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Exportar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modelo">Por Modelo</SelectItem>
                      <SelectItem value="familia">Por Família</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="secondary" onClick={() => exportToExcel('current')}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Acabamento</TableHead>
                      <TableHead>Cor</TableHead>
                      <TableHead>Comprimento</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead>Localizações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productStock.length > 0 ? (
                      productStock.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.product.modelo}</TableCell>
                          <TableCell>{item.product.acabamento}</TableCell>
                          <TableCell>{item.product.cor}</TableCell>
                          <TableCell>{item.product.comprimento} mm</TableCell>
                          <TableCell className="text-right font-bold">{item.totalPecas}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {Array.from(item.locations).map((location, idx) => (
                                <span
                                  key={`${location}-${idx}`}
                                  className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-secondary text-secondary-foreground"
                                >
                                  {location as string}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          {searchFilter ? 'Nenhum produto encontrado com esse filtro' : 'Nenhum material em stock'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stock Histórico */}
        <div className="mb-6">
          <Card className="bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Stock Histórico
              </CardTitle>
              <div className="flex items-center gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <div className="flex items-center gap-2">
                  <Select value={exportType} onValueChange={(value: 'modelo' | 'familia') => setExportType(value)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Exportar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modelo">Por Modelo</SelectItem>
                      <SelectItem value="familia">Por Família</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="secondary" onClick={() => exportToExcel('historical')}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-sm text-muted-foreground">
                Stock calculado para: <span className="font-medium">{format(selectedDate, "dd/MM/yyyy")}</span>
              </div>
              <div className="overflow-auto max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Acabamento</TableHead>
                      <TableHead>Cor</TableHead>
                      <TableHead>Comprimento</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead>Localizações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historicalStock.length > 0 ? (
                      historicalStock
                        .sort((a, b) => b.totalPecas - a.totalPecas)
                        .map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.product.modelo}</TableCell>
                            <TableCell>{item.product.acabamento}</TableCell>
                            <TableCell>{item.product.cor}</TableCell>
                            <TableCell>{item.product.comprimento} mm</TableCell>
                            <TableCell className="text-right font-bold">{item.totalPecas}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {Array.from(item.locations).map((location, idx) => (
                                  <span
                                    key={`${location}-${idx}`}
                                    className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-secondary text-secondary-foreground"
                                  >
                                    {location as string}
                                  </span>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Nenhum stock registado para esta data
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Movements - Full Width */}
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
      </div>
    </div>
  );
};

export default Reports;