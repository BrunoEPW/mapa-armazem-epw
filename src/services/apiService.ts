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
  private baseUrl = 'https://pituxa.epw.pt/api/artigos';
  private cache = new Map<string, { data: ApiArtigo[]; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  async fetchArtigos(draw: number = 1, start: number = 0, length: number = 1000): Promise<ApiArtigo[]> {
    const cacheKey = `${start}-${length}`;
    const cached = this.cache.get(cacheKey);
    
    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log('📦 [ApiService] Using cached data:', cached.data.length, 'items');
      return cached.data;
    }

    try {
      console.log('🌐 [ApiService] Making API request to:', this.baseUrl);
      
      const url = new URL(this.baseUrl);
      url.searchParams.set('draw', draw.toString());
      url.searchParams.set('start', start.toString());
      url.searchParams.set('length', length.toString());
      
      console.log('🔗 [ApiService] Full URL:', url.toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
      
      console.log('📡 [ApiService] Response status:', response.status, response.statusText);
      console.log('📡 [ApiService] Response ok:', response.ok);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result: ApiResponse = await response.json();
      
      console.log('📋 [ApiService] JSON response:', {
        draw: result.draw,
        recordsTotal: result.recordsTotal,
        recordsFiltered: result.recordsFiltered,
        dataLength: result.data?.length || 0,
        firstItem: result.data?.[0] || null
      });
      
      // Cache the data
      this.cache.set(cacheKey, {
        data: result.data || [],
        timestamp: Date.now(),
      });

      if (config.isDevelopment) {
        console.log(`✅ [ApiService] Fetched ${result.data?.length || 0} artigos from API`);
      }

      return result.data || [];
    } catch (error) {
      console.error('❌ [ApiService] Fetch error:', {
        error,
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        url: this.baseUrl
      });
      
      // Return cached data if available, even if expired
      if (cached) {
        console.warn('⚠️ [ApiService] Using expired cache data due to API failure');
        return cached.data;
      }
      
      throw error;
    }
  }

  async fetchAllArtigos(): Promise<ApiArtigo[]> {
    try {
      // Start with a small request to get total count
      const initialData = await this.fetchArtigos(1, 0, 10);
      
      // For now, we'll fetch the first 1000 records
      // In production, you might want to implement pagination
      return await this.fetchArtigos(1, 0, 1000);
    } catch (error) {
      console.error('Failed to fetch all artigos:', error);
      return [];
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const apiService = new ApiService();
export type { ApiArtigo, ApiResponse };