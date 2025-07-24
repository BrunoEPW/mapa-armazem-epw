import { config } from '@/lib/config';

interface ApiArtigo {
  id: string;
  familia: string;
  modelo: string;
  acabamento: string;
  cor: string;
  comprimento: number | string;
  foto?: string;
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
      return cached.data;
    }

    try {
      const url = new URL(this.baseUrl);
      url.searchParams.set('draw', draw.toString());
      url.searchParams.set('start', start.toString());
      url.searchParams.set('length', length.toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result: ApiResponse = await response.json();
      
      // Cache the data
      this.cache.set(cacheKey, {
        data: result.data || [],
        timestamp: Date.now(),
      });

      if (config.isDevelopment) {
        console.log(`Fetched ${result.data?.length || 0} artigos from API`);
      }

      return result.data || [];
    } catch (error) {
      console.error('Failed to fetch artigos:', error);
      
      // Return cached data if available, even if expired
      if (cached) {
        console.warn('Using expired cache data due to API failure');
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