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
    
    console.log(`🔄 [AttributesApiService] Testing proxy: ${proxyUrl}`);
    console.log(`🎯 [AttributesApiService] Target API: ${apiUrl}`);
    
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
    
    console.log(`🌐 [AttributesApiService] Final URL: ${finalUrl}`);
    
    const response = await fetch(finalUrl, fetchOptions);
    
    console.log('📡 [AttributesApiService] Response status:', response.status, response.statusText);
    console.log('📡 [AttributesApiService] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    let result: ApiAttribute[];
    let rawData: any;
    
    if (proxyUrl.includes('allorigins.win')) {
      const proxyResponse = await response.json();
      console.log('📦 [AttributesApiService] AllOrigins proxy response:', proxyResponse);
      
      if (!proxyResponse.contents) {
        throw new Error(`Proxy failed: ${proxyResponse.status?.http_code || 'unknown error'}`);
      }
      
      rawData = proxyResponse.contents;
      result = JSON.parse(rawData);
    } else {
      rawData = await response.text();
      console.log('📦 [AttributesApiService] Raw response text (first 500 chars):', rawData.substring(0, 500));
      result = JSON.parse(rawData);
    }
    
    console.log('📋 [AttributesApiService] Parsed API response:', {
      isArray: Array.isArray(result),
      dataLength: result?.length || 0,
      firstItem: result?.[0] || 'No items',
      dataType: typeof result,
    });

    // Validate data structure
    if (!Array.isArray(result)) {
      console.error('❌ [AttributesApiService] API response is not an array:', result);
      throw new Error('API response is not an array');
    }

    // Validate each item has the expected structure
    const validItems = result.filter((item, index) => {
      const isValid = item && typeof item === 'object' && 
                     typeof item.l === 'string' && 
                     typeof item.d === 'string';
      
      if (!isValid) {
        console.warn(`⚠️ [AttributesApiService] Invalid item at index ${index}:`, item);
      }
      
      return isValid;
    });

    console.log(`✅ [AttributesApiService] Validated ${validItems.length}/${result.length} items`);
    
    if (validItems.length > 0) {
      console.log('📋 [AttributesApiService] Sample valid items:', validItems.slice(0, 3));
    }

    return validItems;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const attributesApiService = new AttributesApiService();
export type { ApiAttribute };