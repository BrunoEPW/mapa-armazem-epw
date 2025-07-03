import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WAREHOUSE_CONFIG } from '@/types/warehouse';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { cn } from '@/lib/utils';
import EPWLogo from '@/components/ui/epw-logo';


const Index = () => {
  const navigate = useNavigate();
  const { materials, selectedShelf } = useWarehouse();
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    setLastUpdate(new Date());
  }, [materials]);

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
      'relative transition-all duration-300 cursor-pointer text-xl md:text-2xl font-bold flex items-center justify-center transform hover:scale-105 rounded-lg shadow-xl',
      'w-12 h-32 sm:w-14 sm:h-40 md:w-16 md:h-48 lg:w-18 lg:h-56',
      'border-2 hover:border-blue-400',
      'bg-gradient-to-br from-gray-600 to-gray-800',
      {
        'text-red-300 border-red-400': status === 'empty',
        'text-yellow-300 border-yellow-400': status === 'low', 
        'text-green-300 border-green-400': status === 'stock',
        'text-blue-300 border-blue-400 bg-gradient-to-br from-blue-600 to-blue-800': isSelected,
      }
    );
  };

  const handleShelfClick = (estante: string) => {
    navigate(`/estante/${estante}`);
  };

  const renderSingleShelf = (estante: string) => (
    <div className="flex flex-col items-center">
      <div
        key={estante}
        className={getShelfClassName(estante)}
        onClick={() => handleShelfClick(estante)}
      >
        <span className="relative z-10 font-black drop-shadow-md">{estante}</span>
      </div>
      {/* Base da estante */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-800 p-1 sm:p-2 rounded-b-lg w-14 sm:w-16 md:w-18 lg:w-20 h-2 sm:h-3 shadow-lg"></div>
    </div>
  );

  const renderShelfGroup = (estantes: string[]) => (
    <div className="flex items-end gap-1 sm:gap-2">
      {estantes.map((estante, index) => (
        <React.Fragment key={estante}>
          <div className="flex flex-col items-center">
            <div
              className={getShelfClassName(estante)}
              onClick={() => handleShelfClick(estante)}
            >
              <span className="relative z-10 font-black drop-shadow-md">{estante}</span>
            </div>
            {/* Base da estante */}
            <div className="bg-gradient-to-r from-gray-700 to-gray-800 p-1 sm:p-2 rounded-b-lg w-14 sm:w-16 md:w-18 lg:w-20 h-2 sm:h-3 shadow-lg"></div>
          </div>
          {index === 0 && estantes.length === 2 && (
            <div className="w-1 sm:w-2 bg-gradient-to-b from-gray-600 to-gray-800 h-20 sm:h-24 md:h-32 lg:h-40 mb-2 sm:mb-3 rounded shadow-md"></div>
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
      color: 'bg-blue-500',
    },
    {
      title: 'Gestão de Produtos',
      description: 'Administre fichas de produtos e características',
      icon: Package,
      path: '/produtos',
      color: 'bg-blue-600',
    },
    {
      title: 'Relatórios',
      description: 'Análise de stock e movimentações',
      icon: BarChart3,
      path: '/relatorios',
      color: 'bg-warehouse-shelf-low',
    },
  ];

  return (
    <div className="min-h-screen bg-warehouse-bg p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header com logo e data/hora */}
        <div className="flex justify-between items-start mb-6 sm:mb-8">
          <div className="flex items-center gap-6">
            <EPWLogo size="large" className="drop-shadow-lg" />
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                Sistema de Gestão de Armazém
              </h1>
              <p className="text-primary text-sm sm:text-base font-medium mt-1">
                Mapa Visual de Stock
              </p>
            </div>
          </div>
          <div className="text-right text-white">
            <p className="text-sm text-gray-300">Última atualização</p>
            <p className="text-lg font-semibold">
              {lastUpdate.toLocaleDateString('pt-PT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </p>
            <p className="text-sm">
              {lastUpdate.toLocaleTimeString('pt-PT', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
        
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
