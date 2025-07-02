import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Warehouse, Search, Package, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Index = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: 'Mapa do Armazém',
      description: 'Vista geral do armazém com estantes interativas',
      icon: Warehouse,
      path: '/armazem',
      color: 'bg-warehouse-shelf-stock',
    },
    {
      title: 'Pesquisa de Materiais',
      description: 'Encontre materiais por modelo, acabamento ou comprimento',
      icon: Search,
      path: '/pesquisa',
      color: 'bg-warehouse-shelf-stock',
    },
    {
      title: 'Gestão de Produtos',
      description: 'Administre fichas de produtos e características',
      icon: Package,
      path: '/login',
      color: 'bg-warehouse-shelf-selected',
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
    <div className="min-h-screen bg-warehouse-bg p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Sistema de Gestão de Stock
          </h1>
          <p className="text-xl text-muted-foreground">
            Gestão completa de armazém com mapa visual interativo
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {menuItems.map((item) => (
            <Card
              key={item.path}
              className="cursor-pointer hover:scale-105 transition-all duration-300 border-2 hover:border-primary"
              onClick={() => navigate(item.path)}
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${item.color}`}>
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{item.description}</p>
                <Button className="mt-4 w-full" onClick={() => navigate(item.path)}>
                  Aceder
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 bg-warehouse-shelf-stock rounded"></div>
              <span>Com Stock</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 bg-warehouse-shelf-low rounded"></div>
              <span>Stock Baixo</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 bg-warehouse-shelf-empty rounded"></div>
              <span>Vazio</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 bg-warehouse-shelf-selected rounded"></div>
              <span>Selecionado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
