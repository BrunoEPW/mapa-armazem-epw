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
  // Use AllOrigins proxy for CORS bypass
  private baseUrl = 'https://api.allorigins.win/get';
  private originalApiUrl = 'https://pituxa.epw.pt/api/artigos';
  private cache = new Map<string, { data: ApiArtigo[]; timestamp: number; recordsTotal: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private prefetchCache = new Map<string, Promise<ApiResponse>>();

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
        recordsTotal: cached.recordsTotal, // Use stored total count
        recordsFiltered: cached.recordsTotal,
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
        recordsTotal: result.recordsTotal || 0
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
    
    // Use AllOrigins proxy
    const proxyUrl = new URL(this.baseUrl);
    proxyUrl.searchParams.set('url', apiUrl.toString());
    
    const response = await fetch(proxyUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // Reduced to 5 seconds
    });
    
    console.log('📡 [ApiService] Response status:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const proxyResponse = await response.json();
    
    if (!proxyResponse.contents) {
      throw new Error(`Proxy failed: ${proxyResponse.status?.http_code || 'unknown error'}`);
    }
    
    // Parse the actual API response from the proxy
    const result: ApiResponse = JSON.parse(proxyResponse.contents);
    
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
}

export const apiService = new ApiService();
export type { ApiArtigo, ApiResponse };