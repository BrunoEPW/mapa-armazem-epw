import React, { useState } from 'react';
import { Search, MapPin, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { FAMILIAS } from '@/data/product-data';
import { useNavigate } from 'react-router-dom';
import { MovementHistoryDialog } from './MovementHistoryDialog';
import { useApiAttributes } from '@/hooks/useApiAttributes';

const SearchPanel: React.FC = () => {
  const navigate = useNavigate();
  const { searchMaterials, setSelectedShelf, products, materials } = useWarehouse();
  const { 
    modelos: apiModelos, 
    acabamentos: apiAcabamentos, 
    comprimentos: apiComprimentos,
    modelosLoading,
    acabamentosLoading,
    comprimentosLoading,
    modelosError,
    acabamentosError,
    comprimentosError
  } = useApiAttributes();
  
  const [searchQuery, setSearchQuery] = useState({
    familia: '',
    modelo: '',
    acabamento: '',
    comprimento: '',
  });
  
  const [searchResults, setSearchResults] = useState<Array<any>>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);

  // Get unique values from products (only for família, others use API)
  const uniqueFamilias = [...new Set(products.map(p => p.familia))].filter(Boolean).sort();
  
  // Use API data with fallback to local data if API fails
  const modelos = modelosError ? [...new Set(products.map(p => p.modelo))].sort() : apiModelos;
  const acabamentos = acabamentosError ? [...new Set(products.map(p => p.acabamento))].sort() : apiAcabamentos;
  const comprimentos = comprimentosError ? [...new Set(products.map(p => p.comprimento.toString()))].sort((a, b) => parseInt(a) - parseInt(b)) : apiComprimentos;

  const handleSearch = () => {
    const query: any = {};
    
    if (searchQuery.familia && searchQuery.familia !== 'all') query.familia = searchQuery.familia;
    if (searchQuery.modelo && searchQuery.modelo !== 'all') query.modelo = searchQuery.modelo;
    if (searchQuery.acabamento && searchQuery.acabamento !== 'all') query.acabamento = searchQuery.acabamento;
    if (searchQuery.comprimento && searchQuery.comprimento !== 'all') query.comprimento = parseInt(searchQuery.comprimento);
    
    const results = searchMaterials(query);
    setSearchResults(results);
  };

  const handleClearSearch = () => {
    setSearchQuery({ familia: '', modelo: '', acabamento: '', comprimento: '' });
    setSearchResults([]);
  };

  const handleLocationClick = (location: { estante: string; prateleira: number }) => {
    setSelectedShelf(location);
    navigate(`/prateleira/${location.estante}/${location.prateleira}`);
  };

  const handleModelClick = (modelo: string) => {
    const modelMaterials = materials.filter(m => m.product.modelo === modelo);
    setSearchResults(modelMaterials);
    setSearchQuery({ familia: '', modelo, acabamento: '', comprimento: '' });
  };

  // Agrupamentos de materiais por modelo com contagens
  const modelGroups = materials.reduce((acc, material) => {
    const modelo = material.product.modelo;
    if (!acc[modelo]) {
      acc[modelo] = {
        modelo,
        totalPecas: 0,
        locations: new Set<string>(),
        materials: []
      };
    }
    acc[modelo].totalPecas += material.pecas;
    acc[modelo].locations.add(`${material.location.estante}${material.location.prateleira}`);
    acc[modelo].materials.push(material);
    return acc;
  }, {} as Record<string, { modelo: string; totalPecas: number; locations: Set<string>; materials: any[] }>);

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="familia">Família</Label>
              <Select value={searchQuery.familia} onValueChange={(value) => setSearchQuery(prev => ({ ...prev, familia: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a família" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as famílias</SelectItem>
                  {uniqueFamilias.map((familia) => (
                    <SelectItem key={familia} value={familia}>
                      {familia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="modelo">Modelo</Label>
              <Select value={searchQuery.modelo} onValueChange={(value) => setSearchQuery(prev => ({ ...prev, modelo: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={modelosLoading ? "Carregando..." : "Selecione o modelo"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os modelos</SelectItem>
                  {modelosLoading ? (
                    <SelectItem value="loading" disabled>Carregando modelos...</SelectItem>
                  ) : modelosError ? (
                    modelos.map((modelo) => (
                      <SelectItem key={modelo} value={modelo}>
                        {modelo}
                      </SelectItem>
                    ))
                  ) : (
                    modelos.map((modelo) => (
                      <SelectItem key={modelo.l} value={modelo.l}>
                        {modelo.d}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="acabamento">Acabamento</Label>
              <Select value={searchQuery.acabamento} onValueChange={(value) => setSearchQuery(prev => ({ ...prev, acabamento: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={acabamentosLoading ? "Carregando..." : "Selecione o acabamento"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os acabamentos</SelectItem>
                  {acabamentosLoading ? (
                    <SelectItem value="loading" disabled>Carregando acabamentos...</SelectItem>
                  ) : acabamentosError ? (
                    acabamentos.map((acabamento) => (
                      <SelectItem key={acabamento} value={acabamento}>
                        {acabamento}
                      </SelectItem>
                    ))
                  ) : (
                    acabamentos.map((acabamento) => (
                      <SelectItem key={acabamento.l} value={acabamento.l}>
                        {acabamento.d}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="comprimento">Comprimento (mm)</Label>
              <Select value={searchQuery.comprimento} onValueChange={(value) => setSearchQuery(prev => ({ ...prev, comprimento: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={comprimentosLoading ? "Carregando..." : "Selecione o comprimento"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os comprimentos</SelectItem>
                  {comprimentosLoading ? (
                    <SelectItem value="loading" disabled>Carregando comprimentos...</SelectItem>
                  ) : comprimentosError ? (
                    comprimentos.map((comprimento) => (
                      <SelectItem key={comprimento} value={comprimento}>
                        {comprimento}mm
                      </SelectItem>
                    ))
                  ) : (
                    comprimentos.map((comprimento) => (
                      <SelectItem key={comprimento.l} value={comprimento.l}>
                        {comprimento.d}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleSearch} className="flex-1">
              <Search className="w-4 h-4 mr-2" />
              Pesquisar
            </Button>
            <Button variant="outline" onClick={handleClearSearch}>
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
                    {group.modelo}
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
        searchQuery.familia || searchQuery.modelo || searchQuery.acabamento || searchQuery.comprimento ? (
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