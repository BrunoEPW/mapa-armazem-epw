import { config } from '@/lib/config';

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

class ApiService {
  // Multiple CORS proxies with automatic fallback
  private corsProxies = [
    'https://api.allorigins.win/get',
    'https://cors-anywhere.herokuapp.com/',
    'https://corsproxy.io/?'
  ];
  private originalApiUrl = 'https://pituxa.epw.pt/api/artigos';
  private cache = new Map<string, { data: ApiArtigo[]; timestamp: number; recordsTotal: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private prefetchCache = new Map<string, Promise<ApiResponse>>();
  private proxyHealthStatus = new Map<string, boolean>();

  async fetchArtigos(draw: number = 1, start: number = 0, length: number = 10): Promise<ApiArtigo[]> {
    const result = await this.fetchArtigosWithTotal(draw, start, length);
    return result.data;
  }

  async fetchArtigosWithTotal(draw: number = 1, start: number = 0, length: number = 10): Promise<ApiResponse> {
    const cacheKey = `${start}-${length}`;
    const cached = this.cache.get(cacheKey);
    
    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log('📦 [ApiService] Using cached data:', cached.data.length, 'items');
      return {
        draw,
        recordsTotal: cached.recordsTotal,
        recordsFiltered: cached.recordsTotal, // Cache uses filtered count
        data: cached.data
      };
    }

    // Check if request is already in progress
    const pendingRequest = this.prefetchCache.get(cacheKey);
    if (pendingRequest) {
      console.log('⏳ [ApiService] Using pending request for', cacheKey);
      return pendingRequest;
    }

    // Create and cache the request promise
    const requestPromise = this.makeRequest(draw, start, length);
    this.prefetchCache.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      
      // Cache the successful result
      this.cache.set(cacheKey, {
        data: result.data || [],
        timestamp: Date.now(),
        recordsTotal: result.recordsFiltered || result.recordsTotal || 0 // Use filtered count as priority
      });

      // Prefetch next page in background
      this.prefetchNextPage(start, length);

      return result;
    } catch (error) {
      console.error('❌ [ApiService] Fetch error:', {
        error,
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        start,
        length
      });
      
      // Return cached data if available, even if expired
      if (cached) {
        console.warn('⚠️ [ApiService] Using expired cache data due to API failure');
        return {
          draw,
          recordsTotal: cached.recordsTotal,
          recordsFiltered: cached.recordsTotal,
          data: cached.data
        };
      }
      
      throw error;
    } finally {
      // Clean up the pending request
      this.prefetchCache.delete(cacheKey);
    }
  }

  private async makeRequest(draw: number, start: number, length: number): Promise<ApiResponse> {
    console.log(`🌐 [ApiService] Fetching page data - start: ${start}, length: ${length}`);
    
    // Build the original API URL with parameters
    const apiUrl = new URL(this.originalApiUrl);
    apiUrl.searchParams.set('draw', draw.toString());
    apiUrl.searchParams.set('start', start.toString());
    apiUrl.searchParams.set('length', length.toString());
    
    // Try each proxy with fallback
    for (let i = 0; i < this.corsProxies.length; i++) {
      const proxyUrl = this.corsProxies[i];
      
      try {
        console.log(`🔄 [ApiService] Trying proxy ${i + 1}/${this.corsProxies.length}: ${proxyUrl}`);
        
        const result = await this.tryProxy(proxyUrl, apiUrl, draw, start, length);
        
        console.log(`✅ [ApiService] Proxy ${i + 1} successful`);
        this.proxyHealthStatus.set(proxyUrl, true);
        
        return result;
      } catch (error) {
        console.warn(`⚠️ [ApiService] Proxy ${i + 1} failed:`, error instanceof Error ? error.message : String(error));
        this.proxyHealthStatus.set(proxyUrl, false);
        
        // If this is the last proxy and all failed, throw the error
        if (i === this.corsProxies.length - 1) {
          throw error;
        }
      }
    }
    
    // This should never be reached, but just in case
    throw new Error('All proxy attempts failed');
  }

  private async tryProxy(proxyUrl: string, apiUrl: URL, draw: number, start: number, length: number): Promise<ApiResponse> {
    let finalUrl: string;
    let fetchOptions: RequestInit;
    
    // Configure request based on proxy type
    if (proxyUrl.includes('allorigins.win')) {
      // AllOrigins proxy
      const url = new URL(proxyUrl);
      url.searchParams.set('url', apiUrl.toString());
      finalUrl = url.toString();
      fetchOptions = {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000), // Increased timeout
      };
    } else if (proxyUrl.includes('cors-anywhere')) {
      // CORS Anywhere proxy
      finalUrl = proxyUrl + apiUrl.toString();
      fetchOptions = {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      };
    } else if (proxyUrl.includes('corsproxy.io')) {
      // CorsProxy.io
      finalUrl = proxyUrl + apiUrl.toString();
      fetchOptions = {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      };
    } else {
      // Default fallback
      finalUrl = proxyUrl + apiUrl.toString();
      fetchOptions = {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      };
    }
    
    const response = await fetch(finalUrl, fetchOptions);
    
    console.log('📡 [ApiService] Response status:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    let result: ApiResponse;
    
    if (proxyUrl.includes('allorigins.win')) {
      // AllOrigins wraps the response
      const proxyResponse = await response.json();
      
      if (!proxyResponse.contents) {
        throw new Error(`Proxy failed: ${proxyResponse.status?.http_code || 'unknown error'}`);
      }
      
      result = JSON.parse(proxyResponse.contents);
    } else {
      // Other proxies return the response directly
      result = await response.json();
    }
    
    console.log('📋 [ApiService] API response:', {
      draw: result.draw,
      recordsTotal: result.recordsTotal,
      recordsFiltered: result.recordsFiltered,
      dataLength: result.data?.length || 0,
      start,
      length
    });

    if (config.isDevelopment) {
      console.log(`✅ [ApiService] Fetched ${result.data?.length || 0} artigos from API (page ${Math.floor(start / length) + 1})`);
    }

    return {
      draw: result.draw,
      recordsTotal: result.recordsTotal || 0,
      recordsFiltered: result.recordsFiltered || 0,
      data: result.data || []
    };
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
  }

  getProxyHealthStatus(): Map<string, boolean> {
    return new Map(this.proxyHealthStatus);
  }

  async testProxyHealth(): Promise<{ [key: string]: boolean }> {
    const healthStatus: { [key: string]: boolean } = {};
    
    for (const proxy of this.corsProxies) {
      try {
        // Test with a simple request
        const testUrl = new URL(this.originalApiUrl);
        testUrl.searchParams.set('draw', '1');
        testUrl.searchParams.set('start', '0');
        testUrl.searchParams.set('length', '1');
        
        await this.tryProxy(proxy, testUrl, 1, 0, 1);
        healthStatus[proxy] = true;
      } catch (error) {
        healthStatus[proxy] = false;
      }
    }
    
    return healthStatus;
  }
}

export const apiService = new ApiService();
export type { ApiArtigo, ApiResponse };