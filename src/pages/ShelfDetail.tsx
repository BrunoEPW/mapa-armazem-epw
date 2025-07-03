import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ShelfDetailView from '@/components/warehouse/ShelfDetailView';
import EPWLogo from '@/components/ui/epw-logo';

const ShelfDetail = () => {
  const { estante, prateleira } = useParams<{ estante: string; prateleira: string }>();
  const navigate = useNavigate();

  console.log('ShelfDetail - Route params:', { estante, prateleira });
  
  if (!estante || !prateleira) {
    console.log('ShelfDetail - Missing route params, navigating to home');
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-warehouse-bg p-4 sm:p-6 lg:p-8" style={{ backgroundColor: 'hsl(220 20% 6%)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white border-white hover:bg-white hover:text-black order-2 sm:order-1"
          >
            <Home className="w-4 h-4" />
            Home
          </Button>
          
          <div className="flex items-center gap-4 order-1 sm:order-2">
            <img 
              src="/lovable-uploads/ce6ad3d6-6728-414c-b327-428c5cd38f81.png" 
              alt="EPW Logo" 
              className="h-8 sm:h-10"
            />
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Prateleira {estante}{prateleira}
            </h1>
          </div>
          
          <div className="order-3 hidden sm:block"></div>
        </div>

        <ShelfDetailView />
      </div>
    </div>
  );
};

export default ShelfDetail;