import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WAREHOUSE_CONFIG } from '@/types/warehouse';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { populateTestDataOffline } from '@/utils/populateTestDataOffline';
import { cn } from '@/lib/utils';
import warehouseHeroBanner from '@/assets/warehouse-hero-banner.jpg';
import EPWLogo from '@/components/ui/epw-logo';
import InvertedTSeparator from '@/components/ui/inverted-t-separator';


import Header from '@/components/Header';
import Footer from '@/components/ui/Footer';
import { DebugPanel } from '@/components/ui/DebugPanel';



const Index = () => {
  const navigate = useNavigate();
  const { 
    materials, 
    products, 
    movements, 
    selectedShelf, 
    populateTestData,
    clearAllData,
    clearAllMaterials
  } = useWarehouse();
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isPopulating, setIsPopulating] = useState(false);
  

  useEffect(() => {
    setLastUpdate(new Date());
  }, [materials]);

  const getShelfStatus = (estante: string) => {
    const shelfMaterials = materials.filter(m => m.location.estante === estante);
    
    if (shelfMaterials.length === 0) return 'empty';
    return 'with-products';
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
        'text-green-300 border-green-400': status === 'empty',
        'text-orange-300 border-orange-400': status === 'with-products',
        'text-blue-300 border-blue-400 bg-gradient-to-br from-blue-600 to-blue-800': isSelected,
      }
    );
  };

  const handleShelfClick = (estante: string) => {
    navigate(`/estante/${estante}`);
  };

  const handlePopulateTestData = async () => {
    if (isPopulating) return;
    
    setIsPopulating(true);
    try {
      console.log('🔄 Substituindo dados existentes por dados de teste...');
      
      // First clear all existing data
      const clearSuccess = await clearAllData();
      if (!clearSuccess) {
        console.error('❌ Erro ao limpar dados existentes');
        return;
      }
      
      console.log('✅ Dados existentes limpos com sucesso');
      
      // Then populate with new test data
      console.log('📦 Populando novos dados de teste...');
      await populateTestData();
      
      console.log('✅ Substituição de dados concluída com sucesso');
    } catch (error) {
      console.error('❌ Erro ao substituir dados de teste:', error);
    } finally {
      setIsPopulating(false);
    }
  };

  const checkSupabaseConnection = async (): Promise<boolean> => {
    try {
      // Tentar uma operação simples no Supabase
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000) // 5 segundos timeout
      });
      return response.ok;
    } catch {
      return false;
    }
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
    </div>
  );

  const renderShelfGroup = (estantes: string[]) => (
    <div className="flex items-end -gap-2">
      {estantes.map((estante) => (
        <div key={estante} className="flex flex-col items-center">
          <div
            className={getShelfClassName(estante)}
            onClick={() => handleShelfClick(estante)}
          >
            <span className="relative z-10 font-black drop-shadow-md">{estante}</span>
          </div>
        </div>
      ))}
    </div>
  );

  const menuItems = [
    {
      title: 'Pesquisa de Materiais',
      icon: Search,
      path: '/pesquisa',
      color: 'bg-emerald-500 hover:bg-emerald-600',
    },
    {
      title: 'Gestão de Produtos',
      icon: Package,
      path: '/produtos',
      color: 'bg-primary hover:bg-primary/90',
    },
    {
      title: 'Relatórios',
      icon: BarChart3,
      path: '/relatorios',
      color: 'bg-orange-500 hover:bg-orange-600',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="p-4 sm:p-6 lg:p-8 relative flex-1">
        <div className="w-full">
        {/* Hero Banner */}
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <div className="relative w-full">
            <img 
              src={warehouseHeroBanner} 
              alt="Warehouse Management System" 
              className="w-full h-48 sm:h-64 lg:h-80 object-cover rounded-xl shadow-2xl"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/80 rounded-xl flex items-center justify-center px-6 sm:px-8 lg:px-12">
              <div className="text-center">
                <h1 className="text-3xl sm:text-4xl lg:text-6xl font-black text-white tracking-wider drop-shadow-2xl mb-2">
                  SISTEMA DE
                </h1>
                <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-orange-400 tracking-wide drop-shadow-2xl">
                  GESTÃO DE ARMAZÉM
                </h2>
                <p className="text-2xl sm:text-3xl lg:text-5xl font-bold text-orange-400 tracking-wide drop-shadow-2xl">
                  EPW
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Info de atualização no canto */}
        <div className="absolute top-4 right-4 text-right text-white">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          {menuItems.map((item) => (
            <Card
              key={item.path}
              className="cursor-pointer hover:scale-105 transition-all duration-300 border-2 hover:border-primary bg-card/50 backdrop-blur-sm"
              onClick={() => navigate(item.path)}
            >
              <CardContent className="p-6 sm:p-8 flex flex-col items-center justify-center">
                <div className={`p-6 sm:p-8 rounded-full ${item.color} transition-all duration-300 shadow-lg hover:shadow-xl`}>
                  <item.icon className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-center mt-4 text-white">
                  {item.title}
                </h3>
              </CardContent>
            </Card>
          ))}
        </div>

        </div>

        {/* Botão para limpar todos os produtos das prateleiras */}
        <div className="flex justify-center mb-4">
          <Button 
            onClick={async () => {
              const success = await clearAllMaterials();
              if (success) {
                console.log('✅ Todos os produtos foram removidos das prateleiras');
              }
            }}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Remover Todos os Produtos das Prateleiras
          </Button>
        </div>
        
        
      </div>

      <DebugPanel 
        additionalInfo={{
          warehouseStats: {
            totalProducts: products.length,
            totalMaterials: materials.length,
            totalMovements: movements.length,
            lastUpdate,
          },
          shelfStatus: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(estante => ({
            shelf: estante,
            status: getShelfStatus(estante),
            materialCount: materials.filter(m => m.location.estante === estante).length,
          })),
        }}
      />

      <Footer />
    </div>
  );
};

export default Index;
