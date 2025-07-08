import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { toast } from 'sonner';

export const useDataReset = (
  setMaterials: React.Dispatch<React.SetStateAction<any[]>>,
  setProducts: React.Dispatch<React.SetStateAction<any[]>>,
  setMovements: React.Dispatch<React.SetStateAction<any[]>>
) => {
  const [isResetting, setIsResetting] = useState(false);

  const clearAllData = async () => {
    try {
      setIsResetting(true);

      if (isSupabaseConfigured) {
        // Clear Supabase data
        await supabase.from('movements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('materials').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }

      // Clear local state
      setMaterials([]);
      setProducts([]);
      setMovements([]);

      // Clear localStorage
      localStorage.removeItem('warehouse-migrated');
      localStorage.removeItem('warehouse-materials');
      localStorage.removeItem('warehouse-products');
      localStorage.removeItem('warehouse-movements');
      localStorage.removeItem('supabase-migration-completed');

      toast.success('Todos os dados foram limpos com sucesso!');
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      toast.error('Erro ao limpar dados');
      return false;
    } finally {
      setIsResetting(false);
    }
  };

  return {
    clearAllData,
    isResetting,
  };
};