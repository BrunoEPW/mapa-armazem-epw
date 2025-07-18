
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Header: React.FC = () => {
  const handleSignOut = async () => {
    // Mock sign out - do nothing in development mode
    console.log('Sign out clicked (development mode)');
  };

  // Mock user data for development
  const mockUser = {
    name: 'Utilizador de Desenvolvimento',
    role: 'admin'
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'editor':
        return 'default';
      case 'viewer':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <header className="bg-background border-b border-border px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold">Warehouse Management</h1>
          <Badge variant="outline" className="text-xs">
            Modo Desenvolvimento
          </Badge>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span className="text-sm font-medium">{mockUser.name}</span>
            <Badge variant={getRoleBadgeVariant(mockUser.role)}>
              {mockUser.role}
            </Badge>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="flex items-center space-x-2"
            disabled
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
