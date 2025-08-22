import { useState, useEffect, useCallback, useRef } from 'react';
import { attributesApiService, ApiAttribute } from '@/services/attributesApiService';

interface UseOptimizedAttributesReturn {
  modelos: ApiAttribute[];
  tipos: ApiAttribute[];
  acabamentos: ApiAttribute[];
  comprimentos: ApiAttribute[];
  cores: ApiAttribute[];
  certificacoes: ApiAttribute[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Cache removed - no caching enabled

export const useOptimizedAttributes = (): UseOptimizedAttributesReturn => {
  const [modelos, setModelos] = useState<ApiAttribute[]>([]);
  const [tipos, setTipos] = useState<ApiAttribute[]>([]);
  const [acabamentos, setAcabamentos] = useState<ApiAttribute[]>([]);
  const [comprimentos, setComprimentos] = useState<ApiAttribute[]>([]);
  const [cores, setCores] = useState<ApiAttribute[]>([]);
  const [certificacoes, setCertificacoes] = useState<ApiAttribute[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cache removed - no caching enabled
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchAttribute = useCallback(async (
    type: string,
    fetchFunction: () => Promise<ApiAttribute[]>,
    setter: (data: ApiAttribute[]) => void
  ) => {
    console.log(`🚀 [useOptimizedAttributes] Making fresh API call for ${type} - no cache enabled`);
    
    try {
      const data = await fetchFunction();
      setter(data);
      console.log(`✅ [useOptimizedAttributes] Fresh API call for ${type} completed successfully`);
    } catch (err) {
      console.warn(`⚠️ [useOptimizedAttributes] Failed to fetch ${type}:`, err);
      setter([]);
    }
  }, []);

  const loadAllAttributes = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      // Load all attributes in parallel but with proper error handling
      await Promise.all([
        fetchAttribute('modelos', attributesApiService.fetchModelos, setModelos),
        fetchAttribute('tipos', attributesApiService.fetchTipos, setTipos),
        fetchAttribute('acabamentos', attributesApiService.fetchAcabamentos, setAcabamentos),
        fetchAttribute('comprimentos', attributesApiService.fetchComprimentos, setComprimentos),
        fetchAttribute('cores', attributesApiService.fetchCores, setCores),
        fetchAttribute('certificacoes', attributesApiService.fetchCertificacoes, setCertificacoes),
      ]);

      console.log('✅ [useOptimizedAttributes] All attributes loaded successfully');
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('❌ [useOptimizedAttributes] Error loading attributes:', err);
        setError('Erro ao carregar atributos da API');
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [fetchAttribute]);

  const refresh = useCallback(async () => {
    console.log('🔄 [useOptimizedAttributes] Manual refresh initiated - no cache to clear');
    await loadAllAttributes();
  }, [loadAllAttributes]);

  // Initial load with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadAllAttributes();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadAllAttributes]);

  return {
    modelos,
    tipos,
    acabamentos,
    comprimentos,
    cores,
    certificacoes,
    loading,
    error,
    refresh,
  };
};