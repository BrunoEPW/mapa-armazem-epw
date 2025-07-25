import { useState, useEffect } from 'react';
import { attributesApiService, type ApiAttribute } from '@/services/attributesApiService';

interface UseApiAttributesReturn {
  modelos: ApiAttribute[];
  tipos: ApiAttribute[];
  modelosLoading: boolean;
  tiposLoading: boolean;
  modelosError: string | null;
  tiposError: string | null;
  refresh: () => Promise<void>;
}

export const useApiAttributes = (): UseApiAttributesReturn => {
  const [modelos, setModelos] = useState<ApiAttribute[]>([]);
  const [tipos, setTipos] = useState<ApiAttribute[]>([]);
  const [modelosLoading, setModelosLoading] = useState(true);
  const [tiposLoading, setTiposLoading] = useState(true);
  const [modelosError, setModelosError] = useState<string | null>(null);
  const [tiposError, setTiposError] = useState<string | null>(null);

  const fetchModelos = async () => {
    try {
      setModelosLoading(true);
      setModelosError(null);
      
      console.log('🔄 [useApiAttributes] Starting to fetch modelos...');
      
      const data = await attributesApiService.fetchModelos();
      setModelos(data);
      
      console.log('✅ [useApiAttributes] Successfully loaded modelos:', {
        count: data.length,
        firstItem: data[0] || 'No items',
        sampleItems: data.slice(0, 3)
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch modelos';
      setModelosError(errorMessage);
      console.error('❌ [useApiAttributes] Error fetching modelos:', {
        error: errorMessage,
        originalError: err,
        existingData: modelos.length
      });
      
      // Keep existing data if available
      if (modelos.length === 0) {
        setModelos([]);
      }
    } finally {
      setModelosLoading(false);
    }
  };

  const fetchTipos = async () => {
    try {
      setTiposLoading(true);
      setTiposError(null);
      
      console.log('🔄 [useApiAttributes] Starting to fetch tipos...');
      
      const data = await attributesApiService.fetchTipos();
      setTipos(data);
      
      console.log('✅ [useApiAttributes] Successfully loaded tipos:', {
        count: data.length,
        firstItem: data[0] || 'No items',
        sampleItems: data.slice(0, 3)
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tipos';
      setTiposError(errorMessage);
      console.error('❌ [useApiAttributes] Error fetching tipos:', {
        error: errorMessage,
        originalError: err,
        existingData: tipos.length
      });
      
      // Keep existing data if available
      if (tipos.length === 0) {
        setTipos([]);
      }
    } finally {
      setTiposLoading(false);
    }
  };

  const refresh = async () => {
    attributesApiService.clearCache();
    await Promise.all([fetchModelos(), fetchTipos()]);
  };

  useEffect(() => {
    fetchModelos();
    fetchTipos();
  }, []);

  return {
    modelos,
    tipos,
    modelosLoading,
    tiposLoading,
    modelosError,
    tiposError,
    refresh,
  };
};
