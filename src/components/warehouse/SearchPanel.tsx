import React, { useState } from 'react';
import { Search, MapPin, Package, AlertCircle, Loader2, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useNavigate } from 'react-router-dom';
import { MovementHistoryDialog } from './MovementHistoryDialog';
import { ModelLocationsDialog } from './ModelLocationsDialog';
import { decodeEPWReference } from '@/utils/epwCodeDecoder';
import { ModeloSelect } from './ModeloSelect';
import { ComprimentoSelect } from './ComprimentoSelect';
import { CorSelect } from './CorSelect';
import { useApiProductsSimple } from '@/hooks/useApiProductsSimple';
import { SearchDebugConsole } from './SearchDebugConsole';

const SearchPanel: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedShelf, materials } = useWarehouse();
  
  // Estado para pesquisa avançada (integrada com API)
  const [selectedModel, setSelectedModel] = useState('all');
  const [selectedComprimento, setSelectedComprimento] = useState('all');
  const [selectedCor, setSelectedCor] = useState('all');
  
  // Estado para resultados e UI
  const [searchResults, setSearchResults] = useState<Array<any>>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [selectedModelData, setSelectedModelData] = useState<any | null>(null);
  const [showModelDialog, setShowModelDialog] = useState(false);
  
  // Hook para buscar produtos da API (com filtro de modelo e comprimento)
  const {
    products: apiProducts,
    loading,
    error,
    currentPage,
    totalPages,
    totalCount,
    setCurrentPage,
    refresh,
    searchQuery,
    setSearchQuery,
    connectionStatus
  } = useApiProductsSimple(
    selectedModel === 'all' ? undefined : selectedModel,
    selectedComprimento === 'all' ? undefined : selectedComprimento,
    selectedCor === 'all' ? undefined : selectedCor
  );

  // Função para pesquisar materiais baseado nos produtos da API
  const handleApiSearch = () => {
    if (selectedModel === 'all' && selectedComprimento === 'all' && selectedCor === 'all' && !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    // Filtrar produtos da API baseado nos critérios
    let filteredApiProducts = apiProducts;
    
    if (selectedModel !== 'all') {
      filteredApiProducts = filteredApiProducts.filter(p => 
        p.codigo && p.codigo.includes(selectedModel)
      );
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredApiProducts = filteredApiProducts.filter(p => 
        p.descricao && p.descricao.toLowerCase().includes(query)
      );
    }

    // Para cada produto da API, encontrar materiais correspondentes no armazém
    const matchingMaterials: any[] = [];
    
    filteredApiProducts.forEach(apiProduct => {
      if (apiProduct.codigo) {
        // Tentar decodificar o código EPW
        const decoded = decodeEPWReference(apiProduct.codigo, false);
        
        if (decoded.success && decoded.product) {
          // Buscar materiais que correspondem aos atributos decodificados
          const relatedMaterials = materials.filter(material => {
            const product = material.product;
            
            // Comparar atributos decodificados com o material
            let matches = true;
            
            if (decoded.product.modelo?.l && product.modelo) {
              matches = matches && product.modelo.toLowerCase().includes(decoded.product.modelo.l.toLowerCase());
            }
            
            if (decoded.product.acabamento?.l && product.acabamento) {
              matches = matches && product.acabamento.toLowerCase().includes(decoded.product.acabamento.l.toLowerCase());
            }
            
            if (decoded.product.cor?.l && product.cor) {
              matches = matches && product.cor.toLowerCase().includes(decoded.product.cor.l.toLowerCase());
            }
            
            // Note: comprimento não está disponível no tipo EPWDecodedProduct
            // Podemos adicionar esta verificação se necessário no futuro
            
            return matches;
          });
          
          matchingMaterials.push(...relatedMaterials);
        } else {
          // Se não conseguiu decodificar, tentar correspondência direta por descrição
          const relatedMaterials = materials.filter(material => {
            if (searchQuery.trim()) {
              const desc = searchQuery.toLowerCase();
              const productDesc = `${material.product.familia} ${material.product.modelo} ${material.product.acabamento}`.toLowerCase();
              return productDesc.includes(desc);
            }
            return false;
          });
          
          matchingMaterials.push(...relatedMaterials);
        }
      }
    });

    // Remover duplicatas
    const uniqueMaterials = matchingMaterials.filter((material, index, self) => 
      index === self.findIndex(m => m.id === material.id)
    );
    
    setSearchResults(uniqueMaterials);
  };

  const handleClearApiSearch = () => {
    setSelectedModel('all');
    setSelectedComprimento('all');
    setSelectedCor('all');
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleLocationClick = (location: { estante: string; prateleira: number }) => {
    setSelectedShelf(location);
    navigate(`/prateleira/${location.estante}/${location.prateleira}`);
  };

  const handleModelClick = (modelData: any) => {
    setSelectedModelData(modelData);
    setShowModelDialog(true);
  };

  // Função para obter o nome do modelo decodificado
  const getModelDisplayName = (modelo: string, product?: any): string => {
    // Se temos um código de produto, tentar decodificar
    if (product?.codigo) {
      const decoded = decodeEPWReference(product.codigo, false);
      if (decoded.success && decoded.product?.modelo?.d) {
        return decoded.product.modelo.d;
      }
    }
    
    // Se não conseguiu decodificar, tentar do nome do modelo existente
    if (modelo && modelo !== 'N/A' && modelo !== 'Indefinido') {
      return modelo;
    }
    
    // Fallback para código ou modelo
    return modelo || 'Modelo Desconhecido';
  };

  // Agrupamentos de materiais por modelo com contagens e localizações detalhadas
  // Filtrar materiais baseado nos filtros selecionados
  const getFilteredMaterials = () => {
    let filteredMaterials = materials;
    
    // Aplicar filtro de modelo se selecionado
    if (selectedModel !== 'all') {
      filteredMaterials = filteredMaterials.filter(material => {
        // Tentar decodificar o código EPW do material se disponível
        if (material.product.codigo) {
          const decoded = decodeEPWReference(material.product.codigo, false);
          if (decoded.success && decoded.product?.modelo?.l) {
            return decoded.product.modelo.l === selectedModel;
          }
        }
        
        // Fallback: comparação direta com o campo modelo
        return material.product.modelo === selectedModel;
      });
    }
    
    // Aplicar filtro de comprimento se selecionado
    if (selectedComprimento !== 'all') {
      filteredMaterials = filteredMaterials.filter(material => 
        material.product.comprimento && material.product.comprimento.toString() === selectedComprimento
      );
    }
    
    // Aplicar filtro de cor se selecionado
    if (selectedCor !== 'all') {
      filteredMaterials = filteredMaterials.filter(material => {
        // Tentar decodificar o código EPW do material se disponível
        if (material.product.codigo) {
          const decoded = decodeEPWReference(material.product.codigo, false);
          if (decoded.success && decoded.product?.cor?.l) {
            return decoded.product.cor.l === selectedCor;
          }
        }
        
        // Fallback: comparação direta com o campo cor
        return material.product.cor === selectedCor;
      });
    }
    
    // Aplicar filtro de pesquisa se inserido
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredMaterials = filteredMaterials.filter(material => {
        const productDesc = `${material.product.familia || ''} ${material.product.modelo || ''} ${material.product.acabamento || ''} ${material.product.cor || ''} ${material.product.descricao || ''}`.toLowerCase();
        return productDesc.includes(query);
      });
    }
    
    return filteredMaterials;
  };

  const filteredMaterials = getFilteredMaterials();

  const modelGroups = filteredMaterials.reduce((acc, material) => {
    const modelo = material.product.modelo || 'Sem Modelo';
    const description = material.product.descricao || `${material.product.familia || ''} ${material.product.modelo || ''} ${material.product.acabamento || ''}`.trim();
    
    if (!acc[modelo]) {
      acc[modelo] = {
        modelo,
        displayName: getModelDisplayName(modelo, material.product),
        totalPecas: 0,
        locations: [],
        materials: [],
        firstProduct: material.product,
        description: description
      };
    }
    acc[modelo].totalPecas += material.pecas;
    acc[modelo].locations.push({
      estante: material.location.estante,
      prateleira: material.location.prateleira,
      posicao: material.location.posicao,
      pecas: material.pecas,
      locationKey: `${material.location.estante}${material.location.prateleira}`
    });
    acc[modelo].materials.push(material);
    return acc;
  }, {} as Record<string, { 
    modelo: string; 
    displayName: string;
    description: string;
    totalPecas: number; 
    locations: Array<{
      estante: string;
      prateleira: number;
      posicao?: string;
      pecas: number;
      locationKey: string;
    }>; 
    materials: any[];
    firstProduct: any;
  }>);

  // Ordenar por ordem alfabética da descrição do modelo
  const sortedModels = Object.values(modelGroups)
    .sort((a, b) => {
      const descA = a.description || a.displayName || a.modelo || '';
      const descB = b.description || b.displayName || b.modelo || '';
      return descA.localeCompare(descB, 'pt', { numeric: true, sensitivity: 'base' });
    });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Pesquisa Avançada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* API Status */}
          <div className="mb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-white/20 rounded-lg bg-white/5">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {loading ? 'Carregando...' : connectionStatus}
                </span>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${
                    !error ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="text-xs text-muted-foreground">
                    {!error ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  onClick={refresh} 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Atualizar
                </Button>
              </div>
            </div>
          </div>

          {/* Filtros de pesquisa ocupando largura total */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
            <ModeloSelect 
              value={selectedModel} 
              onValueChange={(value) => {
                setSelectedModel(value);
                // Trigger search when filter changes
                setTimeout(() => handleApiSearch(), 100);
              }}
            />
            <ComprimentoSelect 
              value={selectedComprimento} 
              onValueChange={(value) => {
                setSelectedComprimento(value);
                // Trigger search when filter changes
                setTimeout(() => handleApiSearch(), 100);
              }}
            />
            <CorSelect 
              value={selectedCor} 
              onValueChange={(value) => {
                setSelectedCor(value);
                // Trigger search when filter changes
                setTimeout(() => handleApiSearch(), 100);
              }}
            />
          </div>
          
          <div className="relative w-full">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por descrição..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                // Trigger search when query changes
                setTimeout(() => handleApiSearch(), 300);
              }}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 w-full"
            />
          </div>
          
          {/* Botão para limpar filtros */}
            {(selectedModel !== 'all' || selectedComprimento !== 'all' || selectedCor !== 'all' || searchQuery.trim()) && (
            <div className="flex justify-center">
              <Button 
                onClick={handleClearApiSearch} 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                Limpar Filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acesso Rápido por Modelo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Acesso Rápido por Modelo
              {(selectedModel !== 'all' || selectedComprimento !== 'all' || selectedCor !== 'all' || searchQuery.trim()) && (
                <Badge variant="secondary" className="ml-2">
                  {(() => {
                    const activeFilters = [];
                    if (selectedModel !== 'all') activeFilters.push('Modelo');
                    if (selectedComprimento !== 'all') activeFilters.push('Comprimento');
                    if (selectedCor !== 'all') activeFilters.push('Cor');
                    if (searchQuery.trim()) activeFilters.push('Pesquisa');
                    return `Filtrado (${activeFilters.join(', ')})`;
                  })()}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-primary">{sortedModels.length}</span>
              <span>de</span>
              <span className="font-medium">{Object.keys(materials.reduce((acc, material) => {
                const modelo = material.product.modelo || 'Sem Modelo';
                acc[modelo] = true;
                return acc;
              }, {} as Record<string, boolean>)).length}</span>
              <span>modelos</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
            {sortedModels.map((group) => {
              // Agregar localizações por estante/prateleira e somar peças
              const locationSummary = group.locations.reduce((acc, loc) => {
                const key = loc.locationKey;
                if (!acc[key]) {
                  acc[key] = {
                    estante: loc.estante,
                    prateleira: loc.prateleira,
                    totalPecas: 0
                  };
                }
                acc[key].totalPecas += loc.pecas;
                return acc;
              }, {} as Record<string, { estante: string; prateleira: number; totalPecas: number }>);

              const uniqueLocations = Object.values(locationSummary);
              const locationText = uniqueLocations.length <= 3 
                ? uniqueLocations.map(loc => `${loc.estante}${loc.prateleira} (${loc.totalPecas})`).join(', ')
                : `${uniqueLocations.slice(0, 2).map(loc => `${loc.estante}${loc.prateleira}`).join(', ')} +${uniqueLocations.length - 2}`;

              return (
                <Button
                  key={group.modelo}
                  variant="outline"
                  onClick={() => handleModelClick(group)}
                  className="h-auto p-4 flex flex-col gap-2 border-2 hover:border-primary hover:bg-primary/5 transition-all duration-200 group text-left"
                >
                  <div className="flex items-start gap-2 w-full">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 group-hover:bg-primary transition-colors mt-1 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-white leading-tight mb-1 truncate">
                        {group.description}
                      </div>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-semibold text-emerald-600 group-hover:text-primary">
                          {group.totalPecas} peças
                        </span>
                        <span className="text-orange-600 group-hover:text-primary">
                          {uniqueLocations.length} loc.
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground leading-tight">
                        {locationText}
                      </div>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
          {sortedModels.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              {(selectedModel !== 'all' || selectedComprimento !== 'all' || selectedCor !== 'all' || searchQuery.trim()) ? (
                <div className="space-y-2">
                  <p className="text-lg font-medium">Nenhum modelo encontrado</p>
                  <p className="text-sm">Os filtros aplicados não retornaram resultados</p>
                  <Button 
                    onClick={handleClearApiSearch} 
                    variant="outline" 
                    size="sm"
                    className="mt-3"
                  >
                    Limpar Filtros
                  </Button>
                </div>
              ) : (
                <p>Nenhum modelo em stock</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products List - Direct from API (like Products page) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Produtos da API
            {(selectedModel !== 'all' || selectedComprimento !== 'all' || selectedCor !== 'all' || searchQuery.trim()) && (
              <Badge variant="secondary" className="ml-2">
                Filtrado
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="w-full overflow-x-auto">
          {error ? (
            <div className="p-6 text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-500 font-medium">Erro ao carregar produtos</p>
              <p className="text-red-400 text-sm mt-1">{error}</p>
            </div>
          ) : loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-white">Carregando produtos...</p>
            </div>
          ) : apiProducts.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
              <p className="text-white text-lg mb-2">Nenhum produto encontrado</p>
              <p className="text-white/60">Tente ajustar os termos de pesquisa</p>
            </div>
          ) : (
            <>
              <div className="w-full">
                <table className="w-full min-w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left p-4 text-white font-medium">Código</th>
                      <th className="text-left p-4 text-white font-medium">Descrição</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiProducts.map((product, index) => (
                      <tr key={product.id || index} className="border-b border-white/10 hover:bg-white/5">
                        <td className="p-4 text-white font-mono text-sm">
                          {product.codigo}
                        </td>
                        <td className="p-4 text-white">
                          {product.descricao}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Numbered Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
                  {/* Previous Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="min-w-[80px]"
                  >
                    Anterior
                  </Button>
                  
                  {/* Page Numbers */}
                  <div className="flex gap-1 flex-wrap">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                      // Show first page, last page, current page and nearby pages
                      const isVisible = 
                        pageNum === 1 || 
                        pageNum === totalPages || 
                        (pageNum >= currentPage - 2 && pageNum <= currentPage + 2);
                      
                      // Show ellipsis
                      const showEllipsisBefore = pageNum === currentPage - 3 && currentPage > 4;
                      const showEllipsisAfter = pageNum === currentPage + 3 && currentPage < totalPages - 3;
                      
                      if (!isVisible && !showEllipsisBefore && !showEllipsisAfter) {
                        return null;
                      }
                      
                      if (showEllipsisBefore || showEllipsisAfter) {
                        return (
                          <span key={`ellipsis-${pageNum}`} className="px-2 py-1 text-white/60">
                            ...
                          </span>
                        );
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`min-w-[40px] ${
                            currentPage === pageNum 
                              ? 'bg-primary text-primary-foreground' 
                              : 'hover:bg-white/10'
                          }`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  {/* Next Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="min-w-[80px]"
                  >
                    Próxima
                  </Button>
                  
                  {/* Page Info */}
                  <div className="text-white text-sm ml-4">
                    Página {currentPage} de {totalPages}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {selectedMaterialId && (
        <MovementHistoryDialog 
          materialId={selectedMaterialId} 
          onClose={() => setSelectedMaterialId(null)} 
        />
      )}

      <ModelLocationsDialog
        modelData={selectedModelData}
        isOpen={showModelDialog}
        onClose={() => setShowModelDialog(false)}
        onLocationClick={handleLocationClick}
      />

      {/* Debug Console */}
      <SearchDebugConsole
        hookData={{
          products: apiProducts,
          loading,
          error,
          currentPage,
          totalPages,
          totalCount,
          isConnected: !error && apiProducts.length >= 0,
          connectionStatus,
          searchQuery
        }}
        selectedModel={selectedModel}
        selectedComprimento={selectedComprimento}
        selectedCor={selectedCor}
        additionalInfo={{ page: 'search', materialsCount: materials.length }}
      />
    </div>
  );
};

export default SearchPanel;