import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useNavigate } from 'react-router-dom';

const SearchPanel: React.FC = () => {
  const navigate = useNavigate();
  const { searchMaterials, setSelectedShelf } = useWarehouse();
  
  const [searchQuery, setSearchQuery] = useState({
    modelo: '',
    acabamento: '',
    comprimento: '',
  });
  
  const [searchResults, setSearchResults] = useState<Array<any>>([]);

  const handleSearch = () => {
    const query: any = {};
    
    if (searchQuery.modelo.trim()) query.modelo = searchQuery.modelo.trim();
    if (searchQuery.acabamento.trim()) query.acabamento = searchQuery.acabamento.trim();
    if (searchQuery.comprimento.trim()) query.comprimento = parseInt(searchQuery.comprimento);
    
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
              <Input
                id="modelo"
                value={searchQuery.modelo}
                onChange={(e) => setSearchQuery(prev => ({ ...prev, modelo: e.target.value }))}
                placeholder="Ex: Perfil L"
              />
            </div>
            
            <div>
              <Label htmlFor="acabamento">Acabamento</Label>
              <Input
                id="acabamento"
                value={searchQuery.acabamento}
                onChange={(e) => setSearchQuery(prev => ({ ...prev, acabamento: e.target.value }))}
                placeholder="Ex: Anodizado"
              />
            </div>
            
            <div>
              <Label htmlFor="comprimento">Comprimento (mm)</Label>
              <Input
                id="comprimento"
                type="number"
                value={searchQuery.comprimento}
                onChange={(e) => setSearchQuery(prev => ({ ...prev, comprimento: e.target.value }))}
                placeholder="Ex: 2000"
              />
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

      {searchResults.length > 0 && (
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
      )}
    </div>
  );
};

export default SearchPanel;