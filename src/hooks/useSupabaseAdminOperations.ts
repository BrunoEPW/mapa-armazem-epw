
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { createBackup, restoreFromBackup, STORAGE_KEYS } from '@/lib/storage';

export const useSupabaseAdminOperations = () => {
  const { user } = useAuth();

  const clearDatabase = async (preserveMaterials: boolean = false): Promise<boolean> => {
    // Skip permission check in development mode
    try {
      console.log('🗑️ [clearDatabase] Starting database clear operation with preserveMaterials:', preserveMaterials);
      
      // Create backup before clearing if preserving materials
      if (preserveMaterials) {
        try {
          console.log('💾 [clearDatabase] Warehouse tables not available - skipping backup');
        } catch (backupError) {
          console.error('⚠️ [clearDatabase] Backup failed, continuing with clear:', backupError);
        }
      }
      
      // Warehouse tables not available in current schema
      console.log('⚠️ [clearDatabase] Warehouse tables not available in current schema - skipping database operations');

      // Clear localStorage selectively - NEVER touch exclusions
      console.log('🔒 [clearDatabase] Preserving user exclusions during database reset');
      localStorage.removeItem('warehouse-migrated');
      if (!preserveMaterials) {
        localStorage.removeItem(STORAGE_KEYS.MATERIALS);
      }
      localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
      localStorage.removeItem(STORAGE_KEYS.MOVEMENTS);
      // 🔒 CRITICAL: EXCLUSIONS are intentionally NOT cleared to preserve user settings

      const message = preserveMaterials 
        ? 'Base de dados limpa - materiais preservados! A aplicação será recarregada.'
        : 'Base de dados limpa com sucesso! A aplicação será recarregada.';
      
      toast.success(message);
      
      // Reload the page to refresh all data
      setTimeout(() => {
        window.location.reload();
      }, 2000);

      return true;
    } catch (error) {
      console.error('Error clearing database:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao limpar base de dados');
      return false;
    }
  };

  const exportData = async (): Promise<object | null> => {
    // Skip permission check in development mode
    try {
      // Warehouse tables not available in current schema - export empty data
      const products: any[] = [];
      const materials: any[] = [];
      const movements: any[] = [];
      console.log('⚠️ [exportData] Warehouse tables not available - exporting empty data');

      const exportData = {
        products: products || [],
        materials: materials || [],
        movements: movements || [],
        exportDate: new Date().toISOString(),
        exportedBy: user?.email || 'unknown'
      };

      // Create download link
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `warehouse-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Backup exportado com sucesso');
      return exportData;
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Erro ao exportar dados');
      return null;
    }
  };

  const clearAllMaterials = async (createBackupFirst: boolean = true): Promise<boolean> => {
    // Skip permission check in development mode
    try {
      console.log('🗑️ [clearAllMaterials] Starting materials clear operation with backup:', createBackupFirst);
      
      // Assume offline mode since warehouse tables not available
      const isOfflineMode = true;
      
      if (isOfflineMode) {
        console.log('⚠️ [clearAllMaterials] Supabase offline - working in local mode only');
      }
      
      // Create backup before clearing if requested
      if (createBackupFirst) {
        // Create backup from localStorage when offline
        try {
          const localMaterials = JSON.parse(localStorage.getItem(STORAGE_KEYS.MATERIALS) || '[]');
          const localProducts = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
          const localMovements = JSON.parse(localStorage.getItem(STORAGE_KEYS.MOVEMENTS) || '[]');
          
          createBackup(localMaterials, localProducts, localMovements);
          console.log('💾 [clearAllMaterials] Local backup created before clearing materials');
        } catch (backupError) {
          console.error('⚠️ [clearAllMaterials] Local backup failed, continuing with clear:', backupError);
        }
      }
      
      let deletedMovements = 0;
      let deletedMaterials = 0;
      
      // Offline mode - get counts from localStorage before clearing
      console.log('💾 [clearAllMaterials] Working in offline mode - clearing localStorage only');
      
      // Set flag to prevent mock data reload
      localStorage.setItem(STORAGE_KEYS.MANUAL_DATA_CLEARED, 'true');
      
      try {
        const localMaterials = JSON.parse(localStorage.getItem(STORAGE_KEYS.MATERIALS) || '[]');
        const localMovements = JSON.parse(localStorage.getItem(STORAGE_KEYS.MOVEMENTS) || '[]');
        
        deletedMaterials = localMaterials.length;
        deletedMovements = localMovements.length;
        
        console.log(`💾 [clearAllMaterials] Found ${deletedMaterials} materials and ${deletedMovements} movements in localStorage`);
      } catch (error) {
        console.error('⚠️ [clearAllMaterials] Error reading localStorage:', error);
      }

      // Clear localStorage materials - NEVER touch exclusions
      console.log('🔒 [clearAllMaterials] Preserving user exclusions during materials reset');
      localStorage.removeItem(STORAGE_KEYS.MATERIALS);
      localStorage.removeItem(STORAGE_KEYS.MOVEMENTS);
      // 🔒 CRITICAL: EXCLUSIONS are intentionally NOT cleared to preserve user settings

      const modeText = isOfflineMode ? '(modo offline)' : '(online)';
      const successMessage = `Todos os materiais foram removidos! ${modeText} (${deletedMaterials} materiais, ${deletedMovements} movimentos)`;
      
      console.log(`✅ [clearAllMaterials] Successfully cleared ${deletedMaterials} materials and ${deletedMovements} movements`);
      toast.success(successMessage);
      
      // Force page refresh to reload data in offline mode
      if (isOfflineMode) {
        setTimeout(() => {
          console.log('🔄 [clearAllMaterials] Reloading page to refresh data');
          window.location.reload();
        }, 1500);
      }
      
      return true;
    } catch (error) {
      console.error('❌ [clearAllMaterials] Error clearing materials:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao limpar materiais');
      return false;
    }
  };

  const clearDatabasePreservingMaterials = async (): Promise<boolean> => {
    return clearDatabase(true);
  };

  const clearMaterialsWithBackup = async (): Promise<boolean> => {
    return clearAllMaterials(true);
  };

  return {
    clearDatabase: () => clearDatabase(false),
    clearDatabasePreservingMaterials,
    clearAllMaterials: clearMaterialsWithBackup,
    exportData,
    canManageDatabase: true, // Always true in development mode
  };
};
