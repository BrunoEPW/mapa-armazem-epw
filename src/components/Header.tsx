
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { config } from '@/lib/config';
import EPWLogo from '@/components/ui/epw-logo';
import SettingsDialog from '@/components/warehouse/SettingsDialog';

const Header: React.FC = () => {

  return (
    <header className="bg-background border-b border-border px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <SettingsDialog>
          <Button variant="ghost" className="p-2 hover:bg-primary/10">
            <EPWLogo size="small" />
          </Button>
        </SettingsDialog>
        
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold">Warehouse Management</h1>
          {config.ui.showDevBadge && (
            <Badge variant="outline" className="text-xs">
              Modo Desenvolvimento
            </Badge>
          )}
        </div>
        
        <div className="w-16"></div> {/* Spacer for balance */}
      </div>
    </header>
  );
};

export default Header;
