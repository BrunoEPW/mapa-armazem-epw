
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { config } from '@/lib/config';

const Header: React.FC = () => {

  return (
    <header className="bg-background border-b border-border px-4 py-3">
      <div className="flex items-center justify-center max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold">Warehouse Management</h1>
          {config.ui.showDevBadge && (
            <Badge variant="outline" className="text-xs">
              Modo Desenvolvimento
            </Badge>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
