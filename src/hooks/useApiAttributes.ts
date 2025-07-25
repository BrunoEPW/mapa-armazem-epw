import { useState, useEffect } from 'react';
import { attributesApiService, type ApiAttribute } from '@/services/attributesApiService';

interface UseApiAttributesReturn {
  modelos: ApiAttribute[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useApiAttributes = (): UseApiAttributesReturn => {
  const [modelos, setModelos] = useState<ApiAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModelos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await attributesApiService.fetchModelos();
      setModelos(data);
      
      console.log('✅ [useApiAttributes] Loaded modelos:', data.length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch modelos';
      setError(errorMessage);
      console.error('❌ [useApiAttributes] Error:', errorMessage);
      
      // Keep existing data if available
      if (modelos.length === 0) {
        setModelos([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    attributesApiService.clearCache();
    await fetchModelos();
  };

  useEffect(() => {
    fetchModelos();
  }, []);

  return {
    modelos,
    loading,
    error,
    refresh,
  };
};
