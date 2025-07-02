import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useNavigate } from 'react-router-dom';

const SearchPanel: React.FC = () => {
  const navigate = useNavigate();
  const { searchMaterials, setSelectedShelf, products } = useWarehouse();
  
  const [searchQuery, setSearchQuery] = useState({
    modelo: '',
    acabamento: '',
    comprimento: '',
  });
  
  const [searchResults, setSearchResults] = useState<Array<any>>([]);

  // Get unique values from products
  const uniqueModelos = [...new Set(products.map(p => p.modelo))].sort();
  const uniqueAcabamentos = [...new Set(products.map(p => p.acabamento))].sort();
  const uniqueComprimentos = [...new Set(products.map(p => p.comprimento.toString()))].sort((a, b) => parseInt(a) - parseInt(b));

  const handleSearch = () => {
    const query: any = {};
    
    if (searchQuery.modelo && searchQuery.modelo !== 'all') query.modelo = searchQuery.modelo;
    if (searchQuery.acabamento && searchQuery.acabamento !== 'all') query.acabamento = searchQuery.acabamento;
    if (searchQuery.comprimento && searchQuery.comprimento !== 'all') query.comprimento = parseInt(searchQuery.comprimento);
    
    const results = searchMaterials(query);
    setSearchResults(results);
  };

  const handleClearSearch = () => {
    setSearchQuery({ modelo: '', acabamento: '', comprimento: '' });
    setSearchResults([]);
  };

  const handleLocationClick = (location: { estante: string; prateleira: number }) => {
    setSelectedShelf(location);
    navigate(`/prateleira/${location.estante}/${location.prateleira}`);
  };

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="modelo">Modelo</Label>
              <Select value={searchQuery.modelo} onValueChange={(value) => setSearchQuery(prev => ({ ...prev, modelo: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o modelo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os modelos</SelectItem>
                  {uniqueModelos.map((modelo) => (
                    <SelectItem key={modelo} value={modelo}>
                      {modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="acabamento">Acabamento</Label>
              <Select value={searchQuery.acabamento} onValueChange={(value) => setSearchQuery(prev => ({ ...prev, acabamento: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o acabamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os acabamentos</SelectItem>
                  {uniqueAcabamentos.map((acabamento) => (
                    <SelectItem key={acabamento} value={acabamento}>
                      {acabamento}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="comprimento">Comprimento (mm)</Label>
              <Select value={searchQuery.comprimento} onValueChange={(value) => setSearchQuery(prev => ({ ...prev, comprimento: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o comprimento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os comprimentos</SelectItem>
                  {uniqueComprimentos.map((comprimento) => (
                    <SelectItem key={comprimento} value={comprimento}>
                      {comprimento}mm
                    </SelectItem>
                  ))}
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
                    <div className="flex-1">
                      <h4 className="font-medium">
                        {material.product.modelo} - {material.product.acabamento}
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
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        searchQuery.modelo || searchQuery.acabamento || searchQuery.comprimento ? (
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
    </div>
  );
};

export default SearchPanel;