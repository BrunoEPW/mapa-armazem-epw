import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export const useSupabaseAdminOperations = () => {
  const { user, hasPermission } = useAuth();

  const clearDatabase = async () => {
    if (!user || !hasPermission('canManageUsers')) {
      toast.error('Não tem permissão para esta operação');
      return false;
    }

    try {
      // Delete in order to respect foreign key constraints
      // 1. Delete movements first
      const { error: movementsError } = await supabase
        .from('movements')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (movementsError) {
        console.error('Error deleting movements:', movementsError);
        throw new Error('Erro ao eliminar movimentos');
      }

      // 2. Delete materials
      const { error: materialsError } = await supabase
        .from('materials')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (materialsError) {
        console.error('Error deleting materials:', materialsError);
        throw new Error('Erro ao eliminar materiais');
      }

      // 3. Delete products
      const { error: productsError } = await supabase
        .from('products')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (productsError) {
        console.error('Error deleting products:', productsError);
        throw new Error('Erro ao eliminar produtos');
      }

      // Clear localStorage as well
      localStorage.removeItem('warehouse-migrated');
      localStorage.removeItem('warehouse-materials');
      localStorage.removeItem('warehouse-products');
      localStorage.removeItem('warehouse-movements');

      toast.success('Base de dados limpa com sucesso! A aplicação será recarregada.');
      
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

  const exportData = async () => {
    if (!user || !hasPermission('canViewReports')) {
      toast.error('Não tem permissão para esta operação');
      return null;
    }

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
        exportedBy: user.email
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

  const clearAllMaterials = async () => {
    if (!user || !hasPermission('canDelete')) {
      toast.error('Não tem permissão para esta operação');
      return false;
    }

    try {
      // Delete movements first (they reference materials)
      const { error: movementsError } = await supabase
        .from('movements')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (movementsError) {
        console.error('Error deleting movements:', movementsError);
        throw new Error('Erro ao eliminar movimentos');
      }

      // Delete materials
      const { error: materialsError } = await supabase
        .from('materials')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (materialsError) {
        console.error('Error deleting materials:', materialsError);
        throw new Error('Erro ao eliminar materiais');
      }

      toast.success('Todos os materiais foram removidos das prateleiras!');
      return true;
    } catch (error) {
      console.error('Error clearing materials:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao limpar materiais');
      return false;
    }
  };

  return {
    clearDatabase,
    clearAllMaterials,
    exportData,
    canManageDatabase: user && hasPermission('canManageUsers'),
  };
};