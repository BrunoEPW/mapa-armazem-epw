import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Package, ArrowRight, X } from 'lucide-react';

interface ModelLocationData {
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
}

interface ModelLocationsDialogProps {
  modelData: ModelLocationData | null;
  isOpen: boolean;
  onClose: () => void;
  onLocationClick: (location: { estante: string; prateleira: number }) => void;
}

export const ModelLocationsDialog: React.FC<ModelLocationsDialogProps> = ({
  modelData,
  isOpen,
  onClose,
  onLocationClick,
}) => {
  if (!modelData) return null;

  // Agregar localizações por estante/prateleira e somar peças
  const locationSummary = modelData.locations.reduce((acc, loc) => {
    const key = loc.locationKey;
    if (!acc[key]) {
      acc[key] = {
        estante: loc.estante,
        prateleira: loc.prateleira,
        totalPecas: 0,
        positions: []
      };
    }
    acc[key].totalPecas += loc.pecas;
    if (loc.posicao) {
      acc[key].positions.push(`${loc.posicao} (${loc.pecas})`);
    }
    return acc;
  }, {} as Record<string, { 
    estante: string; 
    prateleira: number; 
    totalPecas: number;
    positions: string[];
  }>);

  const uniqueLocations = Object.values(locationSummary)
    .sort((a, b) => {
      // Ordenar por estante primeiro, depois por prateleira
      if (a.estante !== b.estante) {
        return a.estante.localeCompare(b.estante);
      }
      return a.prateleira - b.prateleira;
    });

  const handleLocationClick = (location: { estante: string; prateleira: number }) => {
    onLocationClick(location);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <Package className="w-6 h-6 text-primary" />
            <div className="flex-1">
              <div className="text-lg font-medium text-muted-foreground font-normal">
                {modelData.description}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          {/* Resumo total */}
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="font-medium text-white">Total em Stock</span>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    {modelData.totalPecas} peças
                  </Badge>
                  <Badge variant="outline" className="border-primary/30">
                    {uniqueLocations.length} localizações
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de localizações */}
          <div className="space-y-3">
            <h3 className="font-medium text-white flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Localizações Detalhadas
            </h3>
            
            <div className="grid gap-3">
              {uniqueLocations.map((location) => (
                <Card 
                  key={`${location.estante}-${location.prateleira}`}
                  className="hover:bg-white/5 transition-colors border-white/20 cursor-pointer"
                  onClick={() => handleLocationClick({
                    estante: location.estante,
                    prateleira: location.prateleira
                  })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                          <span className="font-medium text-white">
                            Estante {location.estante} - Prateleira {location.prateleira}
                          </span>
                        </div>
                        
                        <div className="mt-2 flex items-center gap-4">
                          <Badge variant="secondary" className="bg-orange-500/20 text-orange-300">
                            {location.totalPecas} peças
                          </Badge>
                          
                          {location.positions.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Posições: {location.positions.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <DialogClose asChild>
          <Button
            variant="outline"
            className="absolute right-4 top-4 w-8 h-8 p-0"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
            <span className="sr-only">Fechar</span>
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};