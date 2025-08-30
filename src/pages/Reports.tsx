import React, { useState } from 'react';
import { TrendingUp, Package, ArrowUpDown, Calendar as CalendarIcon, Search, Download, ArrowLeft } from 'lucide-react';
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
import Footer from '@/components/ui/Footer';
import { ModelLocationsDialog } from '@/components/warehouse/ModelLocationsDialog';

const Reports = () => {
  const navigate = useNavigate();
  const { materials, movements, products } = useWarehouse();
  
  // State for date selection and filters
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState<'nome' | 'quantidade'>('quantidade');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [exportType, setExportType] = useState<'modelo'>('modelo');
  
  // State for locations dialog
  const [showLocationsDialog, setShowLocationsDialog] = useState(false);
  const [selectedProductData, setSelectedProductData] = useState<any>(null);

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

    // Start with current stock (this includes materials added directly)
    materials.forEach(material => {
      const key = `${material.product.modelo}-${material.product.acabamento}-${material.product.cor}-${material.product.comprimento}`;
      if (!historicalMaterials.has(key)) {
        historicalMaterials.set(key, {
          product: material.product,
          totalPecas: 0,
          locations: new Set()
        });
      }
      const existing = historicalMaterials.get(key);
      existing.totalPecas += material.pecas;
      existing.locations.add(`${material.location.estante}${material.location.prateleira}`);
    });

    // Reverse movements that happened AFTER the target date
    // Normalize dates to compare only the date part (YYYY-MM-DD)
    const futureMovements = movements
      .filter(movement => {
        const movementDate = movement.date.split('T')[0]; // Extract YYYY-MM-DD part
        return movementDate > targetDate;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Reverse chronological order

    futureMovements.forEach((movement, index) => {
      const material = materials.find(m => m.id === movement.materialId);
      if (material) {
        const key = `${material.product.modelo}-${material.product.acabamento}-${material.product.cor}-${material.product.comprimento}`;
        const existing = historicalMaterials.get(key);
        if (existing) {
          const previousStock = existing.totalPecas;
          // Reverse the movement: entrada becomes saída and vice-versa
          if (movement.type === 'entrada') {
            existing.totalPecas -= movement.pecas;
          } else {
            existing.totalPecas += movement.pecas;
          }
        }
      }
    });

    const result = Array.from(historicalMaterials.values()).filter(item => item.totalPecas > 0);
    
    return result;
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
      .sort((a, b) => {
        if (sortBy === 'nome') {
          const compareResult = a.product.modelo.localeCompare(b.product.modelo);
          return sortOrder === 'asc' ? compareResult : -compareResult;
        } else {
          const compareResult = a.totalPecas - b.totalPecas;
          return sortOrder === 'asc' ? compareResult : -compareResult;
        }
      });
  };

  const historicalStock = calculateHistoricalStock(selectedDate);
  const productStock = groupedProducts();

  // Export functions
  // Prepare product location data for dialog
  const prepareProductLocationData = (productStockItem: any) => {
    const productMaterials = materials.filter(material => {
      const key = `${material.product.modelo}-${material.product.acabamento}-${material.product.cor}-${material.product.comprimento}`;
      const itemKey = `${productStockItem.product.modelo}-${productStockItem.product.acabamento}-${productStockItem.product.cor}-${productStockItem.product.comprimento}`;
      return key === itemKey;
    });

    const locations = productMaterials.map(material => ({
      estante: material.location.estante,
      prateleira: material.location.prateleira,
      posicao: material.location.posicao,
      pecas: material.pecas,
      locationKey: `${material.location.estante}-${material.location.prateleira}`
    }));

    return {
      modelo: productStockItem.product.codigo || productStockItem.product.modelo,
      displayName: productStockItem.product.codigo || productStockItem.product.modelo,
      description: productStockItem.product.descricao || `${productStockItem.product.modelo} ${productStockItem.product.acabamento} ${productStockItem.product.cor}`,
      totalPecas: productStockItem.totalPecas,
      locations,
      materials: productMaterials,
      firstProduct: productStockItem.product
    };
  };

  const handleProductClick = (productStockItem: any) => {
    const locationData = prepareProductLocationData(productStockItem);
    setSelectedProductData(locationData);
    setShowLocationsDialog(true);
  };

  const handleLocationClick = (location: { estante: string; prateleira: number }) => {
    // Navigate to shelf detail but in read-only mode by adding a query parameter
    navigate(`/prateleira/${location.estante}/${location.prateleira}?readOnly=true`);
  };

  const exportToExcel = (type: 'current' | 'historical') => {
    const data = type === 'current' ? productStock : historicalStock;
    
    let exportData;
    let filename;
    
    if (type === 'historical') {
      // Stock histórico: apenas código, descrição e quantidade
      exportData = data.map(item => ({
        'Código Artigo': item.product.codigo || item.product.modelo,
        'Descrição': item.product.descricao || `${item.product.modelo} ${item.product.acabamento} ${item.product.cor}`,
        'Quantidade': item.totalPecas
      }));
      filename = `stock_historico_${format(selectedDate, 'dd-MM-yyyy')}.xlsx`;
    } else {
      // Stock atual: formato completo por modelo
      exportData = data.map(item => ({
        'Modelo': item.product.modelo,
        'Acabamento': item.product.acabamento,
        'Cor': item.product.cor,
        'Comprimento (mm)': item.product.comprimento,
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
    <div className="min-h-screen bg-warehouse-bg p-4 sm:p-6 lg:p-8 flex flex-col">
      <div className="w-full flex-1">
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/')}
            className="relative w-full transition-all duration-500 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-lg animate-fade-in"
          >
            <img 
              src={reportsBanner} 
              alt="Reports Banner" 
              className="w-full h-32 sm:h-40 object-cover rounded-lg shadow-lg transition-all duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/80 rounded-lg flex items-center justify-center">
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-black text-orange-400 tracking-wider drop-shadow-2xl">
                RELATÓRIOS
              </h1>
            </div>
          </button>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-white hover:text-orange-400 transition-colors duration-200 p-2 rounded-lg hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Voltar</span>
            </button>
          </div>
          

        {/* Stock por Produto */}
        <div className="mb-6">
          <Card className="bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Stock por Produto
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar por modelo..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Button
                      variant={sortBy === 'nome' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        if (sortBy === 'nome') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('nome');
                          setSortOrder('asc');
                        }
                      }}
                      className="text-xs"
                    >
                      Nome {sortBy === 'nome' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </Button>
                    <Button
                      variant={sortBy === 'quantidade' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        if (sortBy === 'quantidade') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('quantidade');
                          setSortOrder('desc');
                        }
                      }}
                      className="text-xs"
                    >
                      Quantidade {sortBy === 'quantidade' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                   {/* Export type selector removed since familia was removed */}
                  <Button variant="secondary" onClick={() => exportToExcel('current')}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productStock.length > 0 ? (
                      productStock.map((item, index) => (
                        <TableRow 
                          key={index}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleProductClick(item)}
                        >
                          <TableCell className="font-medium">{item.product.codigo || item.product.modelo}</TableCell>
                          <TableCell>{item.product.descricao || `${item.product.modelo} ${item.product.acabamento} ${item.product.cor}`}</TableCell>
                          <TableCell className="text-right font-bold">{item.totalPecas}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
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

        {/* Inventários */}
        <div className="mb-6">
          <Card className="bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Inventários
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
                <Button variant="secondary" onClick={() => exportToExcel('historical')}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Selecione uma data e clique em "Exportar" para gerar o inventário para: <span className="font-medium">{format(selectedDate, "dd/MM/yyyy")}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        </div>
      </div>
      <Footer />
      
      {/* Model Locations Dialog */}
      <ModelLocationsDialog
        modelData={selectedProductData}
        isOpen={showLocationsDialog}
        onClose={() => setShowLocationsDialog(false)}
        onLocationClick={handleLocationClick}
      />
    </div>
  );
};

export default Reports;