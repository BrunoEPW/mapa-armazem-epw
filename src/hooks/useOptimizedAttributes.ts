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

// Singleton cache for attributes to share across components
class AttributesCache {
  private static instance: AttributesCache;
  private cache = new Map<string, { data: ApiAttribute[]; timestamp: number }>();
  private cacheTimeout = 10 * 60 * 1000; // 10 minutes

  static getInstance(): AttributesCache {
    if (!AttributesCache.instance) {
      AttributesCache.instance = new AttributesCache();
    }
    return AttributesCache.instance;
  }

  get(key: string): ApiAttribute[] | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  set(key: string, data: ApiAttribute[]): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}

export const useOptimizedAttributes = (): UseOptimizedAttributesReturn => {
  const [modelos, setModelos] = useState<ApiAttribute[]>([]);
  const [tipos, setTipos] = useState<ApiAttribute[]>([]);
  const [acabamentos, setAcabamentos] = useState<ApiAttribute[]>([]);
  const [comprimentos, setComprimentos] = useState<ApiAttribute[]>([]);
  const [cores, setCores] = useState<ApiAttribute[]>([]);
  const [certificacoes, setCertificacoes] = useState<ApiAttribute[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const cache = AttributesCache.getInstance();
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchAttribute = useCallback(async (
    type: string,
    fetchFunction: () => Promise<ApiAttribute[]>,
    setter: (data: ApiAttribute[]) => void
  ) => {
    // Check cache first
    const cached = cache.get(type);
    if (cached) {
      setter(cached);
      return;
    }

    try {
      const data = await fetchFunction();
      setter(data);
      cache.set(type, data);
    } catch (err) {
      console.warn(`⚠️ [useOptimizedAttributes] Failed to fetch ${type}:`, err);
      setter([]);
    }
  }, [cache]);

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
    cache.clear();
    await loadAllAttributes();
  }, [cache, loadAllAttributes]);

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