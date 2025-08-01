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
    console.log(`🌐 [ApiService] Making request via Supabase Edge Function`);
    
    // Build the original API URL with parameters
    const apiUrl = new URL(this.originalApiUrl);
    apiUrl.searchParams.set('draw', draw.toString());
    apiUrl.searchParams.set('start', start.toString());
    apiUrl.searchParams.set('length', length.toString());
    
    // Add filter parameters if provided
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          apiUrl.searchParams.append(key, value);
        }
      });
    }

    try {
      const { data, error } = await supabase.functions.invoke('epw-api-proxy', {
        body: { url: apiUrl.toString() },
      });

      if (error) {
        throw new Error(`Supabase function error: ${error.message}`);
      }

      console.log('📋 [ApiService] API response:', {
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
      console.error('❌ [ApiService] Request failed:', error);
      throw error;
    }
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