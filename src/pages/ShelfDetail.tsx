import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ShelfDetailView from '@/components/warehouse/ShelfDetailView';

const ShelfDetail = () => {
  const { estante, prateleira } = useParams<{ estante: string; prateleira: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-warehouse-bg p-4 sm:p-6 lg:p-8">
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
          
          <h1 className="text-2xl sm:text-3xl font-bold text-white order-1 sm:order-2">
            Prateleira {estante}{prateleira}
          </h1>
          
          <div className="order-3 hidden sm:block"></div>
        </div>

        <ShelfDetailView />
      </div>
    </div>
  );
};

export default ShelfDetail;