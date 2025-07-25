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
      setError(errorMessage);
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
