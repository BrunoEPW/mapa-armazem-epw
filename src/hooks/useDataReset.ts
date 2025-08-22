import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createBackup, restoreFromBackup, shouldPreserveMaterials, STORAGE_KEYS } from '@/lib/storage';
import { 
  createMaterialBackup, 
  isMaterialPreservationEnabled,
  restoreMaterialsFromBackup 
} from '@/utils/materialPreservation';

export const useDataReset = (
  setMaterials: React.Dispatch<React.SetStateAction<any[]>>,
  setProducts: React.Dispatch<React.SetStateAction<any[]>>,
  setMovements: React.Dispatch<React.SetStateAction<any[]>>
) => {
  const [isResetting, setIsResetting] = useState(false);

  const clearAllData = async (preserveMaterials: boolean = false) => {
    try {
      setIsResetting(true);
      
      // Verificar se a preservação automática está ativada
      const autoPreservationEnabled = isMaterialPreservationEnabled();
      const shouldPreserve = preserveMaterials || autoPreservationEnabled;
      
      console.log('🗑️ [clearAllData] Starting data clear with preserveMaterials:', shouldPreserve);
      console.log('🔒 [clearAllData] Auto preservation enabled:', autoPreservationEnabled);

      // Step 1: Get current data from localStorage for backup
      const currentMaterials = JSON.parse(localStorage.getItem(STORAGE_KEYS.MATERIALS) || '[]');
      const currentProducts = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
      const currentMovements = JSON.parse(localStorage.getItem(STORAGE_KEYS.MOVEMENTS) || '[]');
      
      // Sempre criar backup automático se há materiais
      if (currentMaterials.length > 0) {
        createMaterialBackup(currentMaterials);
        if (shouldPreserve) {
          createBackup(currentMaterials, currentProducts, currentMovements);
          console.log('💾 [clearAllData] Backup created for material preservation');
        }
      }

      // Step 2: Clear Supabase data (com preservação inteligente)
      if (!shouldPreserve) {
        await supabase.from('movements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('materials').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } else {
        // Only clear movements when preserving materials
        await supabase.from('movements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        console.log('🔒 [clearAllData] Materials preserved in database (auto-preservation active)');
      }
      await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Step 3: Clear local state (com preservação inteligente)
      if (!shouldPreserve) {
        setMaterials([]);
      } else {
        // Manter materiais no estado se estão sendo preservados
        console.log('🔒 [clearAllData] Mantendo materiais no estado local');
      }
      setProducts([]);
      setMovements([]);

      // Step 4: Clear localStorage (selectively - NEVER touch exclusions or preservation data)
      console.log('🔒 [clearAllData] Preserving user exclusions and material preservation data during data reset');
      localStorage.removeItem('warehouse-migrated');
      if (!shouldPreserve) {
        localStorage.removeItem(STORAGE_KEYS.MATERIALS);
      }
      localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
      localStorage.removeItem(STORAGE_KEYS.MOVEMENTS);
      localStorage.removeItem('supabase-migration-completed');
      // 🔒 CRITICAL: EXCLUSIONS e dados de preservação são intencionalmente NÃO limpos

      const message = shouldPreserve 
        ? 'Produtos limpos - materiais preservados automaticamente!'
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
    // Só limpa tudo se a preservação automática estiver explicitamente desativada
    const autoPreservationEnabled = isMaterialPreservationEnabled();
    if (autoPreservationEnabled) {
      console.log('🔒 [clearAllDataFull] Preservação automática ativa - preservando materiais');
      return clearAllData(true);
    }
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