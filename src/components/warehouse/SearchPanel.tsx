import React, { useState } from 'react';
import { Search, MapPin, Package, AlertCircle, Loader2, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useNavigate } from 'react-router-dom';
import { MovementHistoryDialog } from './MovementHistoryDialog';
import { decodeEPWReference } from '@/utils/epwCodeDecoder';
import { ModeloSelect } from './ModeloSelect';
import { useApiProductsSimple } from '@/hooks/useApiProductsSimple';

const SearchPanel: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedShelf, materials } = useWarehouse();
  
  // Estado para pesquisa avançada (integrada com API)
  const [selectedModel, setSelectedModel] = useState('all');
  
  // Estado para resultados e UI
  const [searchResults, setSearchResults] = useState<Array<any>>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  
  // Hook para buscar produtos da API
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
    setSearchQuery
  } = useApiProductsSimple();

  // Função para pesquisar materiais baseado nos produtos da API
  const handleApiSearch = () => {
    if (selectedModel === 'all' && !searchQuery.trim()) {
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
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleLocationClick = (location: { estante: string; prateleira: number }) => {
    setSelectedShelf(location);
    navigate(`/prateleira/${location.estante}/${location.prateleira}`);
  };

  const handleModelClick = (modelo: string) => {
    const modelMaterials = materials.filter(m => m.product.modelo === modelo);
    setSearchResults(modelMaterials);
    // Limpar pesquisa avançada quando usar acesso rápido
    setSelectedModel('all');
    setSearchQuery('');
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

  // Agrupamentos de materiais por modelo com contagens
  const modelGroups = materials.reduce((acc, material) => {
    const modelo = material.product.modelo;
    if (!acc[modelo]) {
      acc[modelo] = {
        modelo,
        displayName: getModelDisplayName(modelo, material.product),
        totalPecas: 0,
        locations: new Set<string>(),
        materials: [],
        firstProduct: material.product
      };
    }
    acc[modelo].totalPecas += material.pecas;
    acc[modelo].locations.add(`${material.location.estante}${material.location.prateleira}`);
    acc[modelo].materials.push(material);
    return acc;
  }, {} as Record<string, { 
    modelo: string; 
    displayName: string;
    totalPecas: number; 
    locations: Set<string>; 
    materials: any[];
    firstProduct: any;
  }>);

  const sortedModels = Object.values(modelGroups)
    .sort((a, b) => b.totalPecas - a.totalPecas)
    .slice(0, 8); // Mostrar apenas os 8 modelos com mais stock

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
                  {loading ? 'Carregando...' : `${apiProducts.length} produtos disponíveis`}
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

          <div className="max-w-md mx-auto">
            <ModeloSelect 
              value={selectedModel} 
              onValueChange={setSelectedModel}
            />
          </div>
          
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
            />
          </div>
        </CardContent>
      </Card>

      {/* Acesso Rápido por Modelo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Acesso Rápido por Modelo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {sortedModels.map((group) => (
              <Button
                key={group.modelo}
                variant="outline"
                onClick={() => handleModelClick(group.modelo)}
                className="h-auto p-4 flex flex-col gap-2 border-2 hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
              >
                <div className="flex items-center gap-2 w-full">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 group-hover:bg-primary transition-colors"></div>
                  <span className="font-medium text-sm truncate flex-1 text-left">
                    {group.displayName}
                  </span>
                </div>
                <div className="flex justify-between w-full text-xs text-muted-foreground">
                  <span className="font-semibold text-emerald-600 group-hover:text-primary">
                    {group.totalPecas} pcs
                  </span>
                  <span className="text-orange-600 group-hover:text-primary">
                    {group.locations.size} loc.
                  </span>
                </div>
              </Button>
            ))}
          </div>
          {sortedModels.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum modelo em stock</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products List - Direct from API (like Products page) */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos da API</CardTitle>
        </CardHeader>
        <CardContent>
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
              <div className="overflow-x-auto">
                <table className="w-full">
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
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  
                  <span className="text-white text-sm">
                    Página {currentPage} de {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                  </Button>
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
    </div>
  );
};

export default SearchPanel;