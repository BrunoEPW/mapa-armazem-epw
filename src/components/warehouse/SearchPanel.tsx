import React, { useState } from 'react';
import { Search, MapPin, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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
  const [selectedModel, setSelectedModel] = useState('');
  const [searchDescription, setSearchDescription] = useState('');
  
  // Estado para resultados e UI
  const [searchResults, setSearchResults] = useState<Array<any>>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  
  // Hook para buscar produtos da API
  const {
    products: apiProducts,
    loading,
    error,
    refresh
  } = useApiProductsSimple();

  // Função para pesquisar materiais baseado nos produtos da API
  const handleApiSearch = () => {
    if (!selectedModel && !searchDescription.trim()) {
      setSearchResults([]);
      return;
    }

    // Filtrar produtos da API baseado nos critérios
    let filteredApiProducts = apiProducts;
    
    if (selectedModel) {
      filteredApiProducts = filteredApiProducts.filter(p => 
        p.codigo && p.codigo.includes(selectedModel)
      );
    }
    
    if (searchDescription.trim()) {
      const query = searchDescription.toLowerCase();
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
            if (searchDescription.trim()) {
              const desc = searchDescription.toLowerCase();
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
    setSelectedModel('');
    setSearchDescription('');
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
    setSelectedModel('');
    setSearchDescription('');
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <ModeloSelect 
                value={selectedModel} 
                onValueChange={setSelectedModel}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Pesquisa por Descrição</Label>
              <Input
                id="description"
                placeholder="Digite parte da descrição do produto..."
                value={searchDescription}
                onChange={(e) => setSearchDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleApiSearch();
                  }
                }}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleApiSearch} className="flex-1" disabled={loading}>
              <Search className="w-4 h-4 mr-2" />
              {loading ? 'Pesquisando...' : 'Pesquisar'}
            </Button>
            <Button variant="outline" onClick={handleClearApiSearch}>
              Limpar
            </Button>
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

      {searchResults.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>
              Resultados da Pesquisa ({searchResults.length} encontrados)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {searchResults.map((material) => (
                  <div
                    key={material.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex-1 cursor-pointer" 
                        onClick={() => setSelectedMaterialId(material.id)}
                      >
                        <h4 className="font-medium hover:text-primary transition-colors">
                          {material.product.familia} - {material.product.modelo} - {material.product.acabamento}
                        </h4>
                        <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                          <span>Cor: {material.product.cor}</span>
                          <span>Comprimento: {material.product.comprimento}mm</span>
                          <Badge variant="outline">{material.pecas} peças</Badge>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        onClick={() => handleLocationClick(material.location)}
                        className="flex items-center gap-2"
                      >
                        <MapPin className="w-4 h-4" />
                        {material.location.estante}{material.location.prateleira}
                        {material.location.posicao && (
                          <span className="text-xs text-muted-foreground">
                            ({material.location.posicao === 'esquerda' ? 'E' : material.location.posicao === 'central' ? 'C' : 'D'})
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        selectedModel || searchDescription.trim() ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Nenhum resultado encontrado</p>
                <p>Não foi encontrado nenhum produto com essas características no armazém.</p>
              </div>
            </CardContent>
          </Card>
        ) : null
      )}

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