import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WAREHOUSE_CONFIG } from '@/types/warehouse';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { cn } from '@/lib/utils';

const Index = () => {
  const navigate = useNavigate();
  const { materials, selectedShelf } = useWarehouse();

  const getShelfStatus = (estante: string) => {
    const shelfMaterials = materials.filter(m => m.location.estante === estante);
    
    if (shelfMaterials.length === 0) return 'empty';
    
    const totalPecas = shelfMaterials.reduce((sum, m) => sum + m.pecas, 0);
    
    if (totalPecas < 10) return 'low';
    return 'stock';
  };

  const getShelfClassName = (estante: string) => {
    const status = getShelfStatus(estante);
    const isSelected = selectedShelf?.estante === estante;
    
    return cn(
      'relative bg-warehouse-shelf-base transition-all duration-300 cursor-pointer text-xl md:text-2xl font-bold text-white flex items-center justify-center transform hover:scale-105 rounded-t-md',
      'w-24 h-32 sm:w-28 sm:h-40 md:w-32 md:h-48 lg:w-36 lg:h-56',
      'border-4 border-warehouse-shelf-yellow',
      'shadow-lg',
      {
        'after:absolute after:inset-2 after:rounded after:bg-warehouse-shelf-empty': status === 'empty',
        'after:absolute after:inset-2 after:rounded after:bg-warehouse-shelf-low': status === 'low', 
        'after:absolute after:inset-2 after:rounded after:bg-warehouse-shelf-stock': status === 'stock',
        'after:absolute after:inset-2 after:rounded after:bg-warehouse-shelf-selected': isSelected,
      }
    );
  };

  const handleShelfClick = (estante: string) => {
    navigate(`/estante/${estante}`);
  };

  const renderSingleShelf = (estante: string) => (
    <div className="flex flex-col items-center">
      {/* Base vermelha da estante */}
      <div className="bg-warehouse-shelf-separator p-1 sm:p-2 rounded-b-lg w-28 sm:w-32 md:w-36 lg:w-40 h-3 sm:h-4"></div>
      <div
        key={estante}
        className={getShelfClassName(estante)}
        onClick={() => handleShelfClick(estante)}
      >
        <span className="relative z-10 text-black font-black">{estante}</span>
      </div>
    </div>
  );

  const renderShelfGroup = (estantes: string[]) => (
    <div className="flex items-end gap-1 sm:gap-2">
      {estantes.map((estante, index) => (
        <React.Fragment key={estante}>
          <div className="flex flex-col items-center">
            {/* Base vermelha da estante */}
            <div className="bg-warehouse-shelf-separator p-1 sm:p-2 rounded-b-lg w-28 sm:w-32 md:w-36 lg:w-40 h-3 sm:h-4"></div>
            <div
              className={getShelfClassName(estante)}
              onClick={() => handleShelfClick(estante)}
            >
              <span className="relative z-10 text-black font-black">{estante}</span>
            </div>
          </div>
          {index === 0 && estantes.length === 2 && (
            <div className="w-1 sm:w-2 bg-warehouse-shelf-separator h-20 sm:h-24 md:h-32 lg:h-40 mb-3 sm:mb-4"></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const menuItems = [
    {
      title: 'Pesquisa de Materiais',
      description: 'Encontre materiais por modelo, acabamento ou comprimento',
      icon: Search,
      path: '/pesquisa',
      color: 'bg-warehouse-shelf-stock',
      showText: false,
    },
    {
      title: 'Gestão de Produtos',
      description: 'Administre fichas de produtos e características',
      icon: Package,
      path: '/login',
      color: 'bg-warehouse-shelf-selected',
      showText: false,
    },
    {
      title: 'Relatórios',
      description: 'Análise de stock e movimentações',
      icon: BarChart3,
      path: '/relatorios',
      color: 'bg-warehouse-shelf-low',
      showText: true,
    },
  ];

  return (
    <div className="min-h-screen bg-warehouse-bg p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-6 sm:mb-8 text-center">
          Mapa do Armazém
        </h1>
        
        {/* Layout específico das estantes conforme imagem */}
        <div className="flex justify-center items-end gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 overflow-x-auto pb-4">
          {/* Estante A - Isolada à esquerda */}
          {renderSingleShelf('A')}
          
          {/* Grupo B-C */}
          {renderShelfGroup(['B', 'C'])}
          
          {/* Grupo D-E */}
          {renderShelfGroup(['D', 'E'])}
          
          {/* Grupo F-G */}
          {renderShelfGroup(['F', 'G'])}
          
          {/* Estante H - Isolada à direita */}
          {renderSingleShelf('H')}
        </div>

        {/* Menu de navegação */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {menuItems.map((item) => (
            <Card
              key={item.path}
              className="cursor-pointer hover:scale-105 transition-all duration-300 border-2 hover:border-primary"
              onClick={() => navigate(item.path)}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-center mb-3">
                  <div className={`p-4 sm:p-6 rounded-lg ${item.color}`}>
                    <item.icon className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
                  </div>
                </div>
                {item.showText && (
                  <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-center mb-2">{item.title}</h3>
                )}
                <p className="text-sm sm:text-base text-muted-foreground mb-4">{item.description}</p>
                <Button className="w-full" onClick={() => navigate(item.path)}>
                  Aceder
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
