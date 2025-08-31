import React, { useState, useMemo } from 'react';
import { TrendingUp, Package, ArrowUpDown, Calendar as CalendarIcon, Search, Download, ArrowLeft, BarChart3, AlertTriangle, CheckCircle } from 'lucide-react';
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
import { useMinimumStocks } from '@/hooks/useMinimumStocks';
import { useApiAttributes } from '@/hooks/useApiAttributes';
import { decodeEPWReference } from '@/utils/epwCodeDecoder';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import EPWLogo from '@/components/ui/epw-logo';
import Footer from '@/components/ui/Footer';
import { ModelLocationsDialog } from '@/components/warehouse/ModelLocationsDialog';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const Reports = () => {
  const navigate = useNavigate();
  const { materials, movements, products } = useWarehouse();
  const { getMinimumStockSummary, getStockAlerts } = useMinimumStocks(materials, products);
  const { modelos: apiModels } = useApiAttributes();
  
  // State for date selection and filters
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState<'nome' | 'quantidade'>('quantidade');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [exportType, setExportType] = useState<'modelo'>('modelo');
  
  // State for locations dialog
  const [showLocationsDialog, setShowLocationsDialog] = useState(false);
  const [selectedProductData, setSelectedProductData] = useState<any>(null);
  
  // State for drill-down analysis
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [drillDownType, setDrillDownType] = useState<'cor' | 'comprimento'>('cor');
  
  // Get minimum stock data
  const minimumStockSummary = useMemo(() => getMinimumStockSummary(), [getMinimumStockSummary]);
  const stockAlerts = useMemo(() => getStockAlerts(), [getStockAlerts]);

  console.log('🔍 [Reports] Minimum Stock Summary:', minimumStockSummary);

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

  // Prepare chart data
  const prepareChartData = () => {
    // Agrupar por modelo usando epwModelo (com descrição) ou modelo como fallback
    const modelMap = new Map();
    productStock.forEach(item => {
      // Usar epwModelo se disponível, senão usar modelo
      const modeloCode = item.product.epwModelo?.l || item.product.modelo;
      const modeloDesc = item.product.epwModelo?.d || item.product.modelo;
      
      if (!modelMap.has(modeloCode)) {
        modelMap.set(modeloCode, {
          modelo: modeloCode,
          modeloDescricao: modeloDesc,
          quantidade: 0,
          descricao: item.product.descricao,
          items: []
        });
      }
      const existing = modelMap.get(modeloCode);
      existing.quantidade += item.totalPecas;
      existing.items.push(item);
    });

    // Top modelos por quantidade para gráfico de barras
    const modelData = Array.from(modelMap.values())
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 15)
      .map((item, index) => ({
        modelo: item.modelo, // Usar código do modelo para exibição
        modeloCode: item.modelo, // Código do modelo
        modeloDescricao: item.modeloDescricao, // Manter descrição para referência
        quantidade: item.quantidade,
        descricao: item.descricao,
        fill: `hsl(${24 + (index * 25) % 360}, 70%, 50%)`,
        items: item.items
      }));

    // Prepare drill-down data if model is selected
    let drillDownData = [];
    if (selectedModel) {
      // Usar código do modelo para filtrar quando um modelo é selecionado
      const selectedModelCode = selectedModel; // selectedModel já é o código
      const modelItems = productStock.filter(item => 
        (item.product.epwModelo?.l === selectedModelCode) || 
        (item.product.modelo === selectedModelCode)
      );
      
      if (drillDownType === 'cor') {
        const corMap = new Map();
        modelItems.forEach(item => {
          const cor = item.product.cor;
          if (!corMap.has(cor)) {
            corMap.set(cor, 0);
          }
          corMap.set(cor, corMap.get(cor) + item.totalPecas);
        });
        
        drillDownData = Array.from(corMap.entries())
          .map(([cor, quantidade], index) => ({
            name: cor,
            value: quantidade,
            fill: `hsl(${index * 40}, 70%, 60%)`
          }))
          .sort((a, b) => b.value - a.value);
      } else {
        const comprimentoMap = new Map();
        modelItems.forEach(item => {
          const comprimento = item.product.comprimento.toString();
          if (!comprimentoMap.has(comprimento)) {
            comprimentoMap.set(comprimento, 0);
          }
          comprimentoMap.set(comprimento, comprimentoMap.get(comprimento) + item.totalPecas);
        });
        
        drillDownData = Array.from(comprimentoMap.entries())
          .map(([comprimento, quantidade], index) => ({
            name: `${comprimento}mm`,
            value: quantidade,
            fill: `hsl(${index * 40}, 70%, 60%)`
          }))
          .sort((a, b) => b.value - a.value);
      }
    }

    return { modelData, drillDownData };
  };

  const chartData = prepareChartData();

  // Model stock analysis using the same logic as SearchPanel
  const getMaterialModelCode = (material: any): string | null => {
    // Try EPW decoding first
    if (material.product.codigo) {
      try {
        const decoded = decodeEPWReference(material.product.codigo);
        if (decoded && decoded.success && decoded.product?.modelo) {
          const apiModel = apiModels.find(m => 
            m.l.toLowerCase() === decoded.product.modelo.l.toLowerCase() ||
            m.d.toLowerCase().includes(decoded.product.modelo.l.toLowerCase())
          );
          if (apiModel) {
            return apiModel.l;
          }
        }
      } catch (error) {
        // Continue to fallback
      }
    }

    // Fallback to direct model matching
    const materialModel = material.product.modelo?.toLowerCase() || '';
    return apiModels.find(model => 
      model.l.toLowerCase() === materialModel ||
      model.d.toLowerCase().includes(materialModel) ||
      materialModel.includes(model.l.toLowerCase())
    )?.l || null;
  };

  // Group materials by API models
  const apiModelGroups = React.useMemo(() => {
    const groups: Record<string, { modeloCode: string; modeloName: string; totalPecas: number }> = {};
    
    materials.forEach(material => {
      const modelCode = getMaterialModelCode(material);
      const apiModel = apiModels.find(m => m.l === modelCode);
      
      if (modelCode && apiModel) {
        if (!groups[modelCode]) {
          groups[modelCode] = {
            modeloCode: modelCode,
            modeloName: apiModel.d,
            totalPecas: 0
          };
        }
        
        groups[modelCode].totalPecas += material.pecas;
      }
    });
    
    return groups;
  }, [materials, apiModels]);

  // Prepare model stock chart data
  const modelStockChartData = Object.values(apiModelGroups)
    .sort((a, b) => b.totalPecas - a.totalPecas)
    .slice(0, 15)
    .map((item, index) => ({
      modelo: item.modeloName,
      pecas: item.totalPecas,
      fill: `hsl(${24 + (index * 25) % 360}, 70%, 50%)`
    }));

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
      filename = `inventário-${format(selectedDate, 'dd-MM-yyyy')}.xlsx`;
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
      filename = `inventário-${format(new Date(), 'dd-MM-yyyy')}.xlsx`;
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

          {/* Análise Visual */}
          <div className="mb-6">
            <Card className="bg-card/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Análise Visual - Stock por Modelo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  {/* Models Bar Chart */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Modelos em Stock (clique para detalhar)</h3>
                      {selectedModel && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedModel(null)}
                        >
                          Voltar à Vista Geral
                        </Button>
                      )}
                    </div>
                    <div className="h-80">
                      <ChartContainer
                        config={{
                          quantidade: {
                            label: "Quantidade",
                            color: "hsl(var(--primary))",
                          },
                        }}
                        className="h-full w-full"
                      >
                        <BarChart 
                          data={chartData.modelData} 
                          onClick={(data) => {
                            if (data && data.activePayload && data.activePayload[0]) {
                              const modeloCode = data.activePayload[0].payload.modelo;
                              setSelectedModel(modeloCode);
                            }
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="modelo" 
                            tick={{ fontSize: 10 }}
                            height={100}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                          />
                          <YAxis 
                            label={{ value: 'Quantidade', angle: -90, position: 'insideLeft' }}
                          />
                          <ChartTooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-background p-3 border rounded-lg shadow-lg">
                                    <p className="font-semibold">{data.modelo}</p>
                                    {data.modeloDescricao && data.modelo !== data.modeloDescricao && (
                                      <p className="text-sm text-muted-foreground">{data.modeloDescricao}</p>
                                    )}
                                    <p className="text-sm">Quantidade: <span className="font-semibold">{data.quantidade}</span></p>
                                    <p className="text-xs text-muted-foreground mt-1">Clique para detalhar</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar 
                            dataKey="quantidade" 
                            radius={4}
                            className="cursor-pointer hover:opacity-80"
                          />
                        </BarChart>
                      </ChartContainer>
                    </div>
                  </div>

                  {/* Drill-down chart */}
                  {selectedModel && chartData.drillDownData.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <h3 className="text-lg font-semibold">
                          Detalhes do modelo "{selectedModel}" por {drillDownType === 'cor' ? 'Cor' : 'Comprimento'}
                        </h3>
                        <div className="flex gap-2">
                          <Button
                            variant={drillDownType === 'cor' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setDrillDownType('cor')}
                          >
                            Por Cor
                          </Button>
                          <Button
                            variant={drillDownType === 'comprimento' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setDrillDownType('comprimento')}
                          >
                            Por Comprimento
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Bar Chart */}
                        <div className="h-64">
                          <ChartContainer
                            config={{
                              value: {
                                label: "Quantidade",
                                color: "hsl(var(--primary))",
                              },
                            }}
                            className="h-full w-full"
                          >
                            <BarChart data={chartData.drillDownData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="name" 
                                tick={{ fontSize: 12 }}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                              />
                              <YAxis />
                              <ChartTooltip
                                content={<ChartTooltipContent />}
                              />
                              <Bar dataKey="value" radius={4} />
                            </BarChart>
                          </ChartContainer>
                        </div>

                        {/* Pie Chart */}
                        <div className="h-64">
                          <ChartContainer
                            config={{
                              value: {
                                label: "Quantidade",
                                color: "hsl(var(--primary))",
                              },
                            }}
                            className="h-full w-full"
                          >
                            <PieChart>
                              <Pie
                                data={chartData.drillDownData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              >
                                {chartData.drillDownData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Pie>
                              <ChartTooltip
                                content={<ChartTooltipContent />}
                              />
                            </PieChart>
                          </ChartContainer>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Model Stock Chart */}
          <div className="mb-6">
            <Card className="bg-card/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Modelos em Stock - Visão por Quantidade
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Top {modelStockChartData.length} modelos por número de peças em armazém
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ChartContainer
                    config={{
                      pecas: {
                        label: "Peças",
                        color: "hsl(var(--primary))",
                      },
                    }}
                    className="h-full w-full"
                  >
                    <BarChart data={modelStockChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="modelo" 
                        tick={{ fontSize: 10 }}
                        height={100}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                      />
                      <YAxis 
                        label={{ value: 'Número de Peças', angle: -90, position: 'insideLeft' }}
                      />
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-background p-3 border rounded-lg shadow-lg">
                                <p className="font-semibold">{data.modelo}</p>
                                <p className="text-sm">Peças: <span className="font-semibold">{data.pecas}</span></p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="pecas" />
                    </BarChart>
                  </ChartContainer>
                </div>
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

        {/* Stocks Mínimos */}
        {minimumStockSummary.totalProductsWithMinimum > 0 && (
          <div className="mb-6">
            <Card className="bg-card/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Análise de Stocks Mínimos
                </CardTitle>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{minimumStockSummary.totalProductsWithMinimum}</div>
                    <div className="text-sm text-muted-foreground">Produtos Configurados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{minimumStockSummary.productsOk}</div>
                    <div className="text-sm text-muted-foreground">Stock OK</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{minimumStockSummary.productsLow}</div>
                    <div className="text-sm text-muted-foreground">Stock Baixo</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{minimumStockSummary.productsCritical}</div>
                    <div className="text-sm text-muted-foreground">Sem Stock</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {stockAlerts.filter(alert => alert.status !== 'ok').length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-red-600">Produtos que Necessitam Reposição</h3>
                    <div className="overflow-auto max-h-64">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Status</TableHead>
                            <TableHead>Produto</TableHead>
                            <TableHead className="text-right">Stock Atual</TableHead>
                            <TableHead className="text-right">Stock Mínimo</TableHead>
                            <TableHead className="text-right">Necessário</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stockAlerts
                            .filter(alert => alert.status !== 'ok')
                            .sort((a, b) => {
                              if (a.status === 'critical' && b.status !== 'critical') return -1;
                              if (b.status === 'critical' && a.status !== 'critical') return 1;
                              return b.deficit - a.deficit;
                            })
                            .map((alert, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {alert.status === 'critical' ? (
                                      <AlertTriangle className="h-4 w-4 text-red-500" />
                                    ) : (
                                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                                    )}
                                    <Badge 
                                      variant={alert.status === 'critical' ? 'destructive' : 'secondary'}
                                    >
                                      {alert.status === 'critical' ? 'Sem Stock' : 'Stock Baixo'}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{alert.modelo}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {alert.acabamento} - {alert.cor} - {alert.comprimento}mm
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className={alert.currentStock === 0 ? 'text-red-600 font-bold' : ''}>
                                    {alert.currentStock}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">{alert.minimumStock}</TableCell>
                                <TableCell className="text-right">
                                  <span className="text-red-600 font-bold">
                                    {alert.deficit}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-green-600">Todos os stocks estão adequados!</p>
                    <p className="text-muted-foreground">Nenhum produto está abaixo do stock mínimo definido</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

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