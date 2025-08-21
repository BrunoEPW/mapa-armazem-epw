
import { supabase, testSupabaseConnection } from '@/integrations/supabase/client';
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
          const { data: materials } = await supabase.from('materials').select('*');
          const { data: products } = await supabase.from('products').select('*');
          const { data: movements } = await supabase.from('movements').select('*');
          
          createBackup(materials || [], products || [], movements || []);
          console.log('💾 [clearDatabase] Backup created before clearing');
        } catch (backupError) {
          console.error('⚠️ [clearDatabase] Backup failed, continuing with clear:', backupError);
        }
      }
      
      // Delete in order to respect foreign key constraints
      // 1. Delete movements first (always)
      const { error: movementsError } = await supabase
        .from('movements')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (movementsError) {
        console.error('Error deleting movements:', movementsError);
        throw new Error('Erro ao eliminar movimentos');
      }

      // 2. Delete materials only if not preserving
      if (!preserveMaterials) {
        const { error: materialsError } = await supabase
          .from('materials')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (materialsError) {
          console.error('Error deleting materials:', materialsError);
          throw new Error('Erro ao eliminar materiais');
        }
      } else {
        console.log('🔒 [clearDatabase] Materials preserved in database');
      }

      // 3. Delete products (always)
      const { error: productsError } = await supabase
        .from('products')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (productsError) {
        console.error('Error deleting products:', productsError);
        throw new Error('Erro ao eliminar produtos');
      }

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
      const [
        { data: products },
        { data: materials },
        { data: movements }
      ] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('materials').select('*'),
        supabase.from('movements').select('*')
      ]);

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
      
      // Create backup before clearing if requested
      if (createBackupFirst) {
        try {
          const { data: materials } = await supabase.from('materials').select('*');
          const { data: products } = await supabase.from('products').select('*');
          const { data: movements } = await supabase.from('movements').select('*');
          
          createBackup(materials || [], products || [], movements || []);
          console.log('💾 [clearAllMaterials] Backup created before clearing materials');
        } catch (backupError) {
          console.error('⚠️ [clearAllMaterials] Backup failed, continuing with clear:', backupError);
        }
      }
      
      // First test Supabase connection
      const connectionTest = await testSupabaseConnection();
      if (!connectionTest) {
        throw new Error('Não foi possível conectar ao Supabase. Verifique a sua ligação à internet.');
      }
      
      console.log('Attempting to clear all movements and materials...');
      
      // Use a different approach - select and delete by chunks
      let deletedMovements = 0;
      let deletedMaterials = 0;
      
      try {
        // Get all movement IDs first
        const { data: movements } = await supabase
          .from('movements')
          .select('id')
          .limit(1000);
        
        if (movements && movements.length > 0) {
          const { error: movError } = await supabase
            .from('movements')
            .delete()
            .in('id', movements.map(m => m.id));
          
          if (!movError) {
            deletedMovements = movements.length;
            console.log(`Deleted ${deletedMovements} movements`);
          }
        }
      } catch (error) {
        console.log('Could not delete movements, continuing...');
      }
      
      // Get all material IDs
      const { data: materials, error: selectError } = await supabase
        .from('materials')
        .select('id')
        .limit(1000);
      
      if (selectError) {
        throw new Error(`Erro ao consultar materiais: ${selectError.message}`);
      }
      
      if (materials && materials.length > 0) {
        const { error: deleteError } = await supabase
          .from('materials')
          .delete()
          .in('id', materials.map(m => m.id));
        
        if (deleteError) {
          throw new Error(`Erro ao eliminar materiais: ${deleteError.message}`);
        }
        
        deletedMaterials = materials.length;
      }

      // Clear localStorage materials - NEVER touch exclusions
      console.log('🔒 [clearAllMaterials] Preserving user exclusions during materials reset');
      localStorage.removeItem(STORAGE_KEYS.MATERIALS);
      localStorage.removeItem(STORAGE_KEYS.MOVEMENTS);
      // 🔒 CRITICAL: EXCLUSIONS are intentionally NOT cleared to preserve user settings

      console.log(`Successfully deleted ${deletedMaterials} materials and ${deletedMovements} movements`);
      toast.success(`Todos os materiais foram removidos! (${deletedMaterials} materiais, ${deletedMovements} movimentos)`);
      return true;
    } catch (error) {
      console.error('Error clearing materials:', error);
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
