import { useState, useEffect } from 'react';
import { attributesApiService, type ApiAttribute } from '@/services/attributesApiService';

interface UseApiAttributesReturn {
  modelos: ApiAttribute[];
  tipos: ApiAttribute[];
  acabamentos: ApiAttribute[];
  modelosLoading: boolean;
  tiposLoading: boolean;
  acabamentosLoading: boolean;
  modelosError: string | null;
  tiposError: string | null;
  acabamentosError: string | null;
  refresh: () => Promise<void>;
}

export const useApiAttributes = (): UseApiAttributesReturn => {
  const [modelos, setModelos] = useState<ApiAttribute[]>([]);
  const [tipos, setTipos] = useState<ApiAttribute[]>([]);
  const [acabamentos, setAcabamentos] = useState<ApiAttribute[]>([]);
  const [modelosLoading, setModelosLoading] = useState(true);
  const [tiposLoading, setTiposLoading] = useState(true);
  const [acabamentosLoading, setAcabamentosLoading] = useState(true);
  const [modelosError, setModelosError] = useState<string | null>(null);
  const [tiposError, setTiposError] = useState<string | null>(null);
  const [acabamentosError, setAcabamentosError] = useState<string | null>(null);

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

  const fetchAcabamentos = async () => {
    try {
      setAcabamentosLoading(true);
      setAcabamentosError(null);
      
      console.log('🔄 [useApiAttributes] Starting to fetch acabamentos...');
      
      const data = await attributesApiService.fetchAcabamentos();
      setAcabamentos(data);
      
      console.log('✅ [useApiAttributes] Successfully loaded acabamentos:', {
        count: data.length,
        firstItem: data[0] || 'No items',
        sampleItems: data.slice(0, 3)
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch acabamentos';
      setAcabamentosError(errorMessage);
      console.error('❌ [useApiAttributes] Error fetching acabamentos:', {
        error: errorMessage,
        originalError: err,
        existingData: acabamentos.length
      });
      
      // Keep existing data if available
      if (acabamentos.length === 0) {
        setAcabamentos([]);
      }
    } finally {
      setAcabamentosLoading(false);
    }
  };

  const refresh = async () => {
    attributesApiService.clearCache();
    await Promise.all([fetchModelos(), fetchTipos(), fetchAcabamentos()]);
  };

  useEffect(() => {
    fetchModelos();
    fetchTipos();
    fetchAcabamentos();
  }, []);

  return {
    modelos,
    tipos,
    acabamentos,
    modelosLoading,
    tiposLoading,
    acabamentosLoading,
    modelosError,
    tiposError,
    acabamentosError,
    refresh,
  };
};
