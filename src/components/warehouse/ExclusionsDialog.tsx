import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useExclusions } from '@/contexts/ExclusionsContext';
import { Settings, Plus, X, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExclusionsDialogProps {
  excludedCount?: number;
}

export const ExclusionsDialog: React.FC<ExclusionsDialogProps> = ({ excludedCount = 0 }) => {
  const { exclusions, addPrefix, removePrefix, toggleEnabled, clearAllPrefixes } = useExclusions();
  const [newPrefix, setNewPrefix] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleAddPrefix = () => {
    const cleanPrefix = newPrefix.trim().toUpperCase();
    
    if (!cleanPrefix) {
      toast({
        title: "Erro",
        description: "Por favor, insira um prefixo válido",
        variant: "destructive",
      });
      return;
    }

    if (exclusions.prefixes.includes(cleanPrefix)) {
      toast({
        title: "Prefixo já existe",
        description: `O prefixo "${cleanPrefix}" já está na lista de exclusões`,
        variant: "destructive",
      });
      return;
    }

    addPrefix(cleanPrefix);
    setNewPrefix('');
    toast({
      title: "Prefixo adicionado",
      description: `Produtos que iniciem com "${cleanPrefix}" serão excluídos`,
    });
  };

  const handleRemovePrefix = (prefix: string) => {
    removePrefix(prefix);
    toast({
      title: "Prefixo removido",
      description: `"${prefix}" foi removido das exclusões`,
    });
  };

  const handleClearAll = () => {
    clearAllPrefixes();
    toast({
      title: "Exclusões limpas",
      description: "Todos os prefixos foram removidos",
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddPrefix();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-white border-white hover:bg-white hover:text-black"
        >
          <Settings className="w-4 h-4 mr-1" />
          Exclusões
          {exclusions.prefixes.length > 0 && (
            <Badge variant="secondary" className="ml-2 bg-white text-black">
              {exclusions.prefixes.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Gerir Exclusões de Artigos</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Exclusões ativas</span>
            <Switch
              checked={exclusions.enabled}
              onCheckedChange={toggleEnabled}
            />
          </div>

          {/* Statistics */}
          {excludedCount > 0 && (
            <div className="text-sm text-muted-foreground">
              {excludedCount} artigos excluídos da listagem
            </div>
          )}

          {/* Add new prefix */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Adicionar novo prefixo</label>
            <div className="flex gap-2">
              <Input
                value={newPrefix}
                onChange={(e) => setNewPrefix(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ex: SDC, ZZZ, DIV..."
                className="bg-background border-border text-white"
                disabled={!exclusions.enabled}
              />
              <Button
                onClick={handleAddPrefix}
                size="sm"
                disabled={!exclusions.enabled || !newPrefix.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Current exclusions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Prefixos ativos</label>
              {exclusions.prefixes.length > 0 && (
                <Button
                  onClick={handleClearAll}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Limpar tudo
                </Button>
              )}
            </div>
            
            {exclusions.prefixes.length === 0 ? (
              <div className="text-sm text-muted-foreground italic">
                Nenhum prefixo configurado
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {exclusions.prefixes.map((prefix) => (
                  <Badge
                    key={prefix}
                    variant="secondary"
                    className="bg-white/10 text-white border border-white/20"
                  >
                    {prefix}
                    <button
                      onClick={() => handleRemovePrefix(prefix)}
                      className="ml-1 hover:bg-white/20 rounded"
                      disabled={!exclusions.enabled}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Help text */}
          <div className="text-xs text-muted-foreground">
            Artigos cujo código inicie com estes prefixos serão automaticamente excluídos da listagem.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};