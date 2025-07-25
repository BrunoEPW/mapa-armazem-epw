import { config } from '@/lib/config';

interface ApiAttribute {
  l: string; // Letter/Code
  d: string; // Description
}

class AttributesApiService {
  private corsProxies = [
    'https://api.allorigins.win/get',
    'https://cors-anywhere.herokuapp.com/',
    'https://corsproxy.io/?'
  ];
  
  private baseApiUrl = 'https://pituxa.epw.pt/api/atributos';
  private cache = new Map<string, { data: ApiAttribute[]; timestamp: number }>();
  private cacheTimeout = 10 * 60 * 1000; // 10 minutes

  async fetchModelos(): Promise<ApiAttribute[]> {
    return this.fetchAttribute('modelo');
  }

  private async fetchAttribute(attributeType: string): Promise<ApiAttribute[]> {
    const cacheKey = attributeType;
    const cached = this.cache.get(cacheKey);
    
    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`📦 [AttributesApiService] Using cached ${attributeType} data:`, cached.data.length, 'items');
      return cached.data;
    }

    try {
      const result = await this.makeRequest(attributeType);
      
      // Cache the successful result
      this.cache.set(cacheKey, {
        data: result || [],
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error(`❌ [AttributesApiService] Fetch ${attributeType} error:`, {
        error,
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
      });
      
      // Return cached data if available, even if expired
      if (cached) {
        console.warn(`⚠️ [AttributesApiService] Using expired cache data for ${attributeType} due to API failure`);
        return cached.data;
      }
      
      throw error;
    }
  }

  private async makeRequest(attributeType: string): Promise<ApiAttribute[]> {
    console.log(`🌐 [AttributesApiService] Fetching ${attributeType} data`);
    
    const apiUrl = `${this.baseApiUrl}/${attributeType}`;
    
    // Try each proxy with fallback
    for (let i = 0; i < this.corsProxies.length; i++) {
      const proxyUrl = this.corsProxies[i];
      
      try {
        console.log(`🔄 [AttributesApiService] Trying proxy ${i + 1}/${this.corsProxies.length}: ${proxyUrl}`);
        
        const result = await this.tryProxy(proxyUrl, apiUrl);
        
        console.log(`✅ [AttributesApiService] Proxy ${i + 1} successful for ${attributeType}`);
        return result;
      } catch (error) {
        console.warn(`⚠️ [AttributesApiService] Proxy ${i + 1} failed:`, error instanceof Error ? error.message : String(error));
        
        // If this is the last proxy and all failed, throw the error
        if (i === this.corsProxies.length - 1) {
          throw error;
        }
      }
    }
    
    throw new Error('All proxy attempts failed');
  }

  private async tryProxy(proxyUrl: string, apiUrl: string): Promise<ApiAttribute[]> {
    let finalUrl: string;
    let fetchOptions: RequestInit;
    
    // Configure request based on proxy type
    if (proxyUrl.includes('allorigins.win')) {
      const url = new URL(proxyUrl);
      url.searchParams.set('url', apiUrl);
      finalUrl = url.toString();
      fetchOptions = {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      };
    } else if (proxyUrl.includes('cors-anywhere')) {
      finalUrl = proxyUrl + apiUrl;
      fetchOptions = {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      };
    } else if (proxyUrl.includes('corsproxy.io')) {
      finalUrl = proxyUrl + apiUrl;
      fetchOptions = {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      };
    } else {
      finalUrl = proxyUrl + apiUrl;
      fetchOptions = {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      };
    }
    
    const response = await fetch(finalUrl, fetchOptions);
    
    console.log('📡 [AttributesApiService] Response status:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    let result: ApiAttribute[];
    
    if (proxyUrl.includes('allorigins.win')) {
      const proxyResponse = await response.json();
      
      if (!proxyResponse.contents) {
        throw new Error(`Proxy failed: ${proxyResponse.status?.http_code || 'unknown error'}`);
      }
      
      result = JSON.parse(proxyResponse.contents);
    } else {
      result = await response.json();
    }
    
    console.log('📋 [AttributesApiService] API response:', {
      dataLength: result?.length || 0,
    });

    if (config.isDevelopment) {
      console.log(`✅ [AttributesApiService] Fetched ${result?.length || 0} attributes from API`);
    }

    return result || [];
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const attributesApiService = new AttributesApiService();
export type { ApiAttribute };