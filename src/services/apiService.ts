import { supabase } from '@/integrations/supabase/client';

interface ApiArtigo {
  Id: number;
  strCodigo: string;
  strDescricao: string;
  strFoto?: string;
}

interface ApiResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: ApiArtigo[];
}

interface ApiFilters {
  Familia?: string;
  Modelo?: string;
  Tipo?: string;
  Cor?: string;
  Acabamento?: string;
  Comprimento?: string;
}

interface ProxyStatus {
  name: string;
  lastSuccess: number;
  lastFailure: number;
  failureCount: number;
  isBlocked: boolean;
}

class ApiService {
  private originalApiUrl = 'https://pituxa.epw.pt/api/artigos';
  private cache = new Map<string, { data: ApiArtigo[]; timestamp: number; recordsTotal: number; filters?: ApiFilters }>();
  private cacheTimeout = 15 * 60 * 1000; // 15 minutes (mais agressivo)
  private prefetchCache = new Map<string, Promise<ApiResponse>>();
  
  // Circuit breaker para proxies
  private proxyStatuses = new Map<string, ProxyStatus>();
  private circuitBreakerTimeout = 5 * 60 * 1000; // 5 minutes
  
  // Request queue para limitare requisições simultâneas
  private activeRequests = new Set<string>();
  private maxConcurrentRequests = 2;
  private requestQueue = new Map<string, { resolve: Function; reject: Function; params: any }>();
  
  // Timeouts e retry
  private defaultTimeout = 30000; // 30 segundos
  private maxRetries = 3;
  
  // Cache persistente no localStorage
  private persistentCacheKey = 'epw_api_cache';

  async fetchArtigos(draw: number = 1, start: number = 0, length: number = 10): Promise<ApiArtigo[]> {
    const result = await this.fetchArtigosWithTotal(draw, start, length);
    return result.data;
  }

  async fetchArtigosWithTotal(draw: number = 1, start: number = 0, length: number = 10, filters?: ApiFilters): Promise<ApiResponse> {
    const cacheKey = this.generateCacheKey(start, length, filters);
    
    // Verificar cache em memória
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log('📦 [ApiService] Using memory cache:', cached.data.length, 'items');
      return {
        draw,
        recordsTotal: cached.recordsTotal,
        recordsFiltered: cached.recordsTotal,
        data: cached.data
      };
    }
    
    // Verificar cache persistente no localStorage
    const persistentCached = this.getPersistentCache(cacheKey);
    if (persistentCached && Date.now() - persistentCached.timestamp < this.cacheTimeout * 2) {
      console.log('💾 [ApiService] Using persistent cache:', persistentCached.data.length, 'items');
      // Também colocar no cache em memória
      this.cache.set(cacheKey, persistentCached);
      return {
        draw,
        recordsTotal: persistentCached.recordsTotal,
        recordsFiltered: persistentCached.recordsTotal,
        data: persistentCached.data
      };
    }

    // Implementar request queue para evitar sobrecarga
    return this.queueRequest(cacheKey, async () => {
      // Check if request is already in progress
      const pendingRequest = this.prefetchCache.get(cacheKey);
      if (pendingRequest) {
        console.log('⏳ [ApiService] Using pending request for', cacheKey);
        return pendingRequest;
      }

      // Create and cache the request promise
      const requestPromise = this.makeRequestWithRetry(draw, start, length, filters);
      this.prefetchCache.set(cacheKey, requestPromise);
      return requestPromise;
    });

  }
  
  private async queueRequest(cacheKey: string, requestFn: () => Promise<ApiResponse>): Promise<ApiResponse> {
    // Se já está na fila, aguardar
    if (this.requestQueue.has(cacheKey)) {
      return new Promise((resolve, reject) => {
        const existing = this.requestQueue.get(cacheKey);
        this.requestQueue.set(cacheKey, {
          resolve: (result: ApiResponse) => {
            existing?.resolve(result);
            resolve(result);
          },
          reject: (error: Error) => {
            existing?.reject(error);
            reject(error);
          },
          params: null
        });
      });
    }

    // Se excedeu limite de requisições simultâneas, aguardar
    while (this.activeRequests.size >= this.maxConcurrentRequests) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.activeRequests.add(cacheKey);

    try {
      const result = await requestFn();
      
      // Cache the successful result em memória e localStorage
      const cacheData = {
        data: result.data || [],
        timestamp: Date.now(),
        recordsTotal: result.recordsFiltered || result.recordsTotal || 0
      };
      
      this.cache.set(cacheKey, cacheData);
      this.setPersistentCache(cacheKey, cacheData);

      // Prefetch next page in background (conservative)
      if (this.activeRequests.size < this.maxConcurrentRequests) {
        this.prefetchNextPage(this.extractStartFromCacheKey(cacheKey), this.extractLengthFromCacheKey(cacheKey));
      }

      // Resolver requisições na fila
      const queued = this.requestQueue.get(cacheKey);
      if (queued) {
        queued.resolve(result);
        this.requestQueue.delete(cacheKey);
      }

      return result;
    } catch (error) {
      console.error('❌ [ApiService] Fetch error:', error);
      
      // Rejeitar requisições na fila
      const queued = this.requestQueue.get(cacheKey);
      if (queued) {
        queued.reject(error);
        this.requestQueue.delete(cacheKey);
      }
      
      // Return cached data if available, even if expired
      const cached = this.cache.get(cacheKey) || this.getPersistentCache(cacheKey);
      if (cached) {
        console.warn('⚠️ [ApiService] Using expired cache data due to API failure');
        return {
          draw: 1,
          recordsTotal: cached.recordsTotal,
          recordsFiltered: cached.recordsTotal,
          data: cached.data
        };
      }
      
      throw error;
    } finally {
      this.activeRequests.delete(cacheKey);
      this.prefetchCache.delete(cacheKey);
    }
  }

  private async makeRequestWithRetry(draw: number, start: number, length: number, filters?: ApiFilters): Promise<ApiResponse> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const timeout = this.defaultTimeout + (attempt - 1) * 10000; // Timeout progressivo
        console.log(`🔄 [ApiService] Attempt ${attempt}/${this.maxRetries} with ${timeout}ms timeout`);
        
        return await this.makeRequest(draw, start, length, filters, timeout);
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ [ApiService] Attempt ${attempt} failed:`, error.message);
        
        if (attempt < this.maxRetries) {
          const backoff = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
          console.log(`⏳ [ApiService] Waiting ${backoff}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, backoff));
        }
      }
    }
    
    throw lastError;
  }

  private async makeRequest(draw: number, start: number, length: number, filters?: ApiFilters, timeout: number = this.defaultTimeout): Promise<ApiResponse> {
    console.log(`🌐 [ApiService] Making API request with ${timeout}ms timeout`);
    
    // Build the original API URL with parameters
    const apiUrl = new URL(this.originalApiUrl);
    apiUrl.searchParams.set('draw', draw.toString());
    apiUrl.searchParams.set('start', start.toString());
    apiUrl.searchParams.set('length', length.toString());
    
    // Add ordering parameters for consistent results
    apiUrl.searchParams.set('order[0][column]', '1');
    apiUrl.searchParams.set('order[0][dir]', 'ASC');
    
    // Add filter parameters if provided
    if (filters) {
      console.log(`🔧 [ApiService] Adding filters to URL:`, filters);
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== 'all') {
          console.log(`📌 [ApiService] Adding filter: ${key} = ${value}`);
          apiUrl.searchParams.set(key, value);
        }
      });
    }
    
    console.log(`🌐 [ApiService] Final API URL:`, apiUrl.toString());

    // Tentar primeiro a API direta (firewall desativada)
    try {
      console.log('🔄 [ApiService] Trying direct API call (no proxy)...');
      const response = await this.fetchWithTimeout(apiUrl.toString(), timeout);
      const data = await response.json();
      
      console.log('✅ [ApiService] Success with direct API call:', {
        draw: data.draw,
        recordsTotal: data.recordsTotal,
        recordsFiltered: data.recordsFiltered,
        dataLength: data.data?.length || 0
      });

      return {
        draw: data.draw || draw,
        recordsTotal: data.recordsTotal || 0,
        recordsFiltered: data.recordsFiltered || 0,
        data: data.data || []
      };
    } catch (error) {
      console.warn('⚠️ [ApiService] Direct API failed, trying proxies:', error.message);
    }

    // Try proxies with circuit breaker
    const proxies = [
      { url: `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl.toString())}`, name: 'allorigins' },
      { url: `https://corsproxy.io/?${encodeURIComponent(apiUrl.toString())}`, name: 'corsproxy' },
      { url: `https://cors-anywhere.herokuapp.com/${apiUrl.toString()}`, name: 'cors-anywhere' }
    ];
    
    // Filtrar proxies baseado no circuit breaker
    const availableProxies = this.getAvailableProxies(proxies);

    for (const proxy of availableProxies) {
      try {
        console.log(`🔄 [ApiService] Trying ${proxy.name} proxy...`);
        
        const response = await this.fetchWithTimeout(proxy.url, timeout);
        
        let data;
        if (proxy.name === 'allorigins') {
          // allorigins wraps the response in a contents field
          const wrapper = await response.json();
          data = JSON.parse(wrapper.contents);
        } else {
          data = await response.json();
        }
        
        console.log(`✅ [ApiService] Success with ${proxy.name} proxy:`, {
          draw: data.draw,
          recordsTotal: data.recordsTotal,
          recordsFiltered: data.recordsFiltered,
          dataLength: data.data?.length || 0
        });

        // Marcar proxy como bem sucedido
        this.markProxySuccess(proxy.name);

        return {
          draw: data.draw || draw,
          recordsTotal: data.recordsTotal || 0,
          recordsFiltered: data.recordsFiltered || 0,
          data: data.data || []
        };
        
      } catch (error) {
        console.warn(`⚠️ [ApiService] ${proxy.name} proxy failed:`, error.message);
        this.markProxyFailure(proxy.name);
      }
    }

    // Se todos falharam
    throw new Error(`All proxy services failed or are circuit-broken`);
  }

  private async fetchWithTimeout(url: string, timeout: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private getAvailableProxies(allProxies: { url: string; name: string }[]): { url: string; name: string }[] {
    const now = Date.now();
    return allProxies
      .map(proxy => ({ ...proxy, status: this.getProxyStatus(proxy.name) }))
      .filter(proxy => !proxy.status.isBlocked || (now - proxy.status.lastFailure) > this.circuitBreakerTimeout)
      .sort((a, b) => {
        // Priorizar proxies que funcionaram recentemente
        if (a.status.lastSuccess > b.status.lastSuccess) return -1;
        if (a.status.lastSuccess < b.status.lastSuccess) return 1;
        return a.status.failureCount - b.status.failureCount;
      });
  }

  private getProxyStatus(proxyName: string): ProxyStatus {
    if (!this.proxyStatuses.has(proxyName)) {
      this.proxyStatuses.set(proxyName, {
        name: proxyName,
        lastSuccess: 0,
        lastFailure: 0,
        failureCount: 0,
        isBlocked: false
      });
    }
    return this.proxyStatuses.get(proxyName)!;
  }

  private markProxySuccess(proxyName: string): void {
    const status = this.getProxyStatus(proxyName);
    status.lastSuccess = Date.now();
    status.failureCount = 0;
    status.isBlocked = false;
    console.log(`✅ [ApiService] Proxy ${proxyName} marked as successful`);
  }

  private markProxyFailure(proxyName: string): void {
    const status = this.getProxyStatus(proxyName);
    status.lastFailure = Date.now();
    status.failureCount++;
    
    // Bloquear proxy se falhar mais de 3 vezes consecutivas
    if (status.failureCount >= 3) {
      status.isBlocked = true;
      console.warn(`🚫 [ApiService] Proxy ${proxyName} circuit-broken (${status.failureCount} failures)`);
    }
  }

  private getPersistentCache(cacheKey: string): any {
    try {
      const stored = localStorage.getItem(`${this.persistentCacheKey}_${cacheKey}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('⚠️ [ApiService] Failed to read persistent cache:', error);
      return null;
    }
  }

  private setPersistentCache(cacheKey: string, data: any): void {
    try {
      localStorage.setItem(`${this.persistentCacheKey}_${cacheKey}`, JSON.stringify(data));
    } catch (error) {
      console.warn('⚠️ [ApiService] Failed to write persistent cache:', error);
    }
  }

  private extractStartFromCacheKey(cacheKey: string): number {
    const parts = cacheKey.split('-');
    return parseInt(parts[0]) || 0;
  }

  private extractLengthFromCacheKey(cacheKey: string): number {
    const parts = cacheKey.split('-');
    return parseInt(parts[1]) || 10;

    // This should never be reached, but just in case
    throw new Error('No proxy services available');
  }

  private prefetchNextPage(currentStart: number, length: number): void {
    const nextStart = currentStart + length;
    const nextCacheKey = `${nextStart}-${length}`;
    
    // Only prefetch if not already cached or pending
    if (!this.cache.has(nextCacheKey) && !this.prefetchCache.has(nextCacheKey)) {
      console.log('🔮 [ApiService] Prefetching next page:', nextStart);
      
      // Start prefetch in background (don't await)
      this.fetchArtigosWithTotal(1, nextStart, length).catch(error => {
        console.log('⚠️ [ApiService] Prefetch failed (silent):', error.message);
      });
    }
  }

  async fetchAllArtigos(): Promise<ApiArtigo[]> {
    try {
      // Start with a small request to get total count
      const initialData = await this.fetchArtigos(1, 0, 10);
      
      // Fetch all records (up to 4000)
      return await this.fetchArtigos(1, 0, 4000);
    } catch (error) {
      console.error('Failed to fetch all artigos:', error);
      return [];
    }
  }

  clearCache(): void {
    this.cache.clear();
    this.prefetchCache.clear();
    this.activeRequests.clear();
    this.requestQueue.clear();
    this.proxyStatuses.clear();
    
    // Limpar também o cache persistente
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.persistentCacheKey)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('⚠️ [ApiService] Failed to clear persistent cache:', error);
    }
  }

  private generateCacheKey(start: number, length: number, filters?: ApiFilters): string {
    const filterKey = filters ? JSON.stringify(filters) : '';
    return `${start}-${length}-${filterKey}`;
  }
}

export const apiService = new ApiService();
export type { ApiArtigo, ApiResponse, ApiFilters };