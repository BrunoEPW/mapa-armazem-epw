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
  Modelo?: string;
  Tipo?: string;
  Cor?: string;
  Acabamento?: string;
  Comprimento?: string;
}

class ApiService {
  private originalApiUrl = 'https://pituxa.epw.pt/api/artigos';
  private cache = new Map<string, { data: ApiArtigo[]; timestamp: number; recordsTotal: number; filters?: ApiFilters }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private prefetchCache = new Map<string, Promise<ApiResponse>>();

  async fetchArtigos(draw: number = 1, start: number = 0, length: number = 10): Promise<ApiArtigo[]> {
    const result = await this.fetchArtigosWithTotal(draw, start, length);
    return result.data;
  }

  async fetchArtigosWithTotal(draw: number = 1, start: number = 0, length: number = 10, filters?: ApiFilters): Promise<ApiResponse> {
    const cacheKey = this.generateCacheKey(start, length, filters);
    const cached = this.cache.get(cacheKey);
    
    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log('📦 [ApiService] Using cached data:', cached.data.length, 'items');
      return {
        draw,
        recordsTotal: cached.recordsTotal,
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
    const requestPromise = this.makeRequest(draw, start, length, filters);
    this.prefetchCache.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      
      // Cache the successful result
      this.cache.set(cacheKey, {
        data: result.data || [],
        timestamp: Date.now(),
        recordsTotal: result.recordsFiltered || result.recordsTotal || 0,
        filters
      });

      // Prefetch next page in background (only for unfiltered requests)
      if (!filters || Object.keys(filters).length === 0) {
        this.prefetchNextPage(start, length);
      }

      return result;
    } catch (error) {
      console.error('❌ [ApiService] Fetch error:', error);
      
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

  private async makeRequest(draw: number, start: number, length: number, filters?: ApiFilters): Promise<ApiResponse> {
    console.log(`🌐 [ApiService] Making direct API request`);
    
    // Build the original API URL with parameters
    const apiUrl = new URL(this.originalApiUrl);
    apiUrl.searchParams.set('draw', draw.toString());
    apiUrl.searchParams.set('start', start.toString());
    apiUrl.searchParams.set('length', length.toString());
    
    // Add filter parameters if provided
    if (filters) {
      console.log(`🔧 [ApiService] Adding filters to URL:`, filters);
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          console.log(`📌 [ApiService] Adding filter: ${key} = ${value}`);
          apiUrl.searchParams.append(key, value);
        }
      });
    }
    
    console.log(`🌐 [ApiService] Final API URL:`, apiUrl.toString());

    // Try multiple proxy options in sequence
    const proxies = [
      `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl.toString())}`,
      `https://corsproxy.io/?${encodeURIComponent(apiUrl.toString())}`,
      `https://cors-anywhere.herokuapp.com/${apiUrl.toString()}`
    ];

    for (let i = 0; i < proxies.length; i++) {
      const proxyUrl = proxies[i];
      const proxyName = ['allorigins', 'corsproxy', 'cors-anywhere'][i];
      
      try {
        console.log(`🔄 [ApiService] Trying ${proxyName} proxy...`);
        
        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.error(`❌ [ApiService] ${proxyName} HTTP error:`, {
            status: response.status,
            statusText: response.statusText,
            url: proxyUrl
          });
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        let data;
        if (proxyName === 'allorigins') {
          // allorigins wraps the response in a contents field
          const wrapper = await response.json();
          data = JSON.parse(wrapper.contents);
        } else {
          data = await response.json();
        }
        
        console.log(`✅ [ApiService] Success with ${proxyName} proxy:`, {
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
        console.warn(`⚠️ [ApiService] ${proxyName} proxy failed:`, error.message);
        
        // If this is the last proxy, throw the error
        if (i === proxies.length - 1) {
          throw new Error(`All proxy services failed. Last error: ${error.message}`);
        }
        // Otherwise, continue to the next proxy
      }
    }

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
  }

  private generateCacheKey(start: number, length: number, filters?: ApiFilters): string {
    const filterKey = filters ? JSON.stringify(filters) : '';
    return `${start}-${length}-${filterKey}`;
  }
}

export const apiService = new ApiService();
export type { ApiArtigo, ApiResponse, ApiFilters };