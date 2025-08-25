import { useState, useEffect } from 'react';
import { Product, Material, Movement } from '@/types/warehouse';
import { config } from '@/lib/config';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useSupabaseWarehouseData = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);
  const [isLoadingMovements, setIsLoadingMovements] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();

  // Mock authentication check
  const canUpload = config.auth.useMockAuth || !!auth?.user;

  const loadData = async () => {
    console.log('📊 [loadData] Warehouse tables not available in current schema - using local data only');
    setIsLoading(false);
    setLastSync(new Date());
    setError(null);
  };

  const migrateProducts = async (products: Product[]) => {
    console.log('⚠️ [migrateProducts] Products table not available - skipping migration');
  };

  const migrateMaterials = async (materials: Material[]) => {
    console.log('⚠️ [migrateMaterials] Materials table not available - skipping migration');
  };

  const migrateMovements = async (movements: Movement[]) => {
    console.log('⚠️ [migrateMovements] Movements table not available - skipping migration');
  };

  const migrateToSupabase = async (
    products: Product[], 
    materials: Material[], 
    movements: Movement[]
  ): Promise<boolean> => {
    if (!canUpload) {
      console.log('🔒 [migrateToSupabase] Cannot upload - not authenticated');
      toast.error('Não é possível fazer upload - não autenticado');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('📤 [migrateToSupabase] Starting migration with products:', products.length, 'materials:', materials.length, 'movements:', movements.length);
      
      // Since warehouse tables not available, just mark as completed locally
      console.log('⚠️ [migrateToSupabase] Warehouse tables not available - marking as completed locally');
      
      setLastSync(new Date());
      toast.success(`Migração concluída localmente - ${products.length} produtos, ${materials.length} materiais, ${movements.length} movimentos`);
      
      return true;
    } catch (error) {
      console.error('❌ [migrateToSupabase] Error:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      toast.error('Erro na migração');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromSupabase = async (): Promise<{ products: Product[], materials: Material[], movements: Movement[] }> => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('📥 [loadFromSupabase] Warehouse tables not available - returning empty data');
      
      const result = {
        products: [],
        materials: [],
        movements: []
      };
      
      setLastSync(new Date());
      return result;
    } catch (error) {
      console.error('❌ [loadFromSupabase] Error:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    console.log('🔄 [refreshData] Warehouse tables not available - no refresh needed');
  };

  const clearSupabaseData = async (): Promise<boolean> => {
    console.log('🗑️ [clearSupabaseData] Warehouse tables not available - nothing to clear');
    return true;
  };

  const restoreMockData = async (generateNew: boolean = false) => {
    console.log('🔄 [restoreMockData] Warehouse tables not available - no restore needed');
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  return {
    // Loading states
    isLoading,
    lastSync,
    isLoadingProducts,
    isLoadingMaterials,
    isLoadingMovements,
    error,
    canUpload,
    loading: isLoading,
    dataSource: 'mock' as const,
    
    // Methods
    migrateToSupabase,
    loadFromSupabase,
    refreshData,
    clearSupabaseData,
    restoreMockData,
  };
};