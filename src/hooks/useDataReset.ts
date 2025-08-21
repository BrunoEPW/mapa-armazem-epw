import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createBackup, restoreFromBackup, shouldPreserveMaterials, STORAGE_KEYS } from '@/lib/storage';

export const useDataReset = (
  setMaterials: React.Dispatch<React.SetStateAction<any[]>>,
  setProducts: React.Dispatch<React.SetStateAction<any[]>>,
  setMovements: React.Dispatch<React.SetStateAction<any[]>>
) => {
  const [isResetting, setIsResetting] = useState(false);

  const clearAllData = async (preserveMaterials: boolean = false) => {
    try {
      setIsResetting(true);
      console.log('🗑️ [clearAllData] Starting data clear with preserveMaterials:', preserveMaterials);

      // Step 1: Get current data from localStorage for backup
      const currentMaterials = JSON.parse(localStorage.getItem(STORAGE_KEYS.MATERIALS) || '[]');
      const currentProducts = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
      const currentMovements = JSON.parse(localStorage.getItem(STORAGE_KEYS.MOVEMENTS) || '[]');
      
      if (preserveMaterials && currentMaterials.length > 0) {
        createBackup(currentMaterials, currentProducts, currentMovements);
        console.log('💾 [clearAllData] Backup created for material preservation');
      }

      // Step 2: Clear Supabase data
      if (!preserveMaterials) {
        await supabase.from('movements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('materials').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } else {
        // Only clear movements when preserving materials
        await supabase.from('movements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        console.log('🔒 [clearAllData] Materials preserved in database');
      }
      await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Step 3: Clear local state (selectively)
      if (!preserveMaterials) {
        setMaterials([]);
      }
      setProducts([]);
      setMovements([]);

      // Step 4: Clear localStorage (selectively - NEVER touch exclusions)
      console.log('🔒 [clearAllData] Preserving user exclusions during data reset');
      localStorage.removeItem('warehouse-migrated');
      if (!preserveMaterials) {
        localStorage.removeItem(STORAGE_KEYS.MATERIALS);
      }
      localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
      localStorage.removeItem(STORAGE_KEYS.MOVEMENTS);
      localStorage.removeItem('supabase-migration-completed');
      // 🔒 CRITICAL: EXCLUSIONS are intentionally NOT cleared to preserve user settings

      const message = preserveMaterials 
        ? 'Produtos limpos - materiais preservados!'
        : 'Todos os dados foram limpos com sucesso!';
      
      toast.success(message);
      console.log('✅ [clearAllData] Data clear completed successfully');
      return true;
    } catch (error) {
      console.error('❌ [clearAllData] Error clearing data:', error);
      toast.error('Erro ao limpar dados');
      return false;
    } finally {
      setIsResetting(false);
    }
  };

  const clearAllDataFull = async () => {
    return clearAllData(false);
  };

  const clearDataPreservingMaterials = async () => {
    return clearAllData(true);
  };

  return {
    clearAllData: clearAllDataFull,
    clearDataPreservingMaterials,
    isResetting,
  };
};