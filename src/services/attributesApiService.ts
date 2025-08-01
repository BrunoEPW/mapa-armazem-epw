import { supabase } from '@/integrations/supabase/client';

interface ApiAttribute {
  l: string; // Letter/Code
  d: string; // Description
}

class AttributesApiService {
  private baseApiUrl = 'https://pituxa.epw.pt/api/atributos';
  private cache = new Map<string, { data: ApiAttribute[]; timestamp: number }>();
  private cacheTimeout = 10 * 60 * 1000; // 10 minutes

  async fetchModelos(): Promise<ApiAttribute[]> {
    return this.fetchAttribute('modelo');
  }

  async fetchTipos(): Promise<ApiAttribute[]> {
    return this.fetchAttribute('tipo');
  }

  async fetchAcabamentos(): Promise<ApiAttribute[]> {
    return this.fetchAttribute('acabamento');
  }

  async fetchComprimentos(): Promise<ApiAttribute[]> {
    return this.fetchAttribute('comprimento');
  }

  async fetchCores(): Promise<ApiAttribute[]> {
    return this.fetchAttribute('cor');
  }

  async fetchCertificacoes(): Promise<ApiAttribute[]> {
    return this.fetchAttribute('certificacao');
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
      console.error(`❌ [AttributesApiService] Fetch ${attributeType} error:`, error);
      
      // Return cached data if available, even if expired
      if (cached) {
        console.warn(`⚠️ [AttributesApiService] Using expired cache data for ${attributeType} due to API failure`);
        return cached.data;
      }
      
      // Fallback to basic static data for critical attributes
      const fallbackData = this.getFallbackData(attributeType);
      if (fallbackData.length > 0) {
        console.warn(`🔄 [AttributesApiService] Using fallback data for ${attributeType}: ${fallbackData.length} items`);
        return fallbackData;
      }
      
      throw error;
    }
  }

  private async makeRequest(attributeType: string): Promise<ApiAttribute[]> {
    console.log(`🌐 [AttributesApiService] Fetching ${attributeType} via proxy`);
    
    const apiUrl = `${this.baseApiUrl}/${attributeType}`;
    
    // Try multiple proxy options in sequence - prioritize allorigins as it's currently working
    const proxies = [
      `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`,
      `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`,
      `https://cors-anywhere.herokuapp.com/${apiUrl}`
    ];

    for (let i = 0; i < proxies.length; i++) {
      const proxyUrl = proxies[i];
      const proxyName = ['allorigins', 'corsproxy', 'cors-anywhere'][i];
      
      try {
        console.log(`🔄 [AttributesApiService] Trying ${proxyName} proxy for ${attributeType}...`);
        
        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
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
        
        console.log(`📊 [AttributesApiService] Raw data received for ${attributeType}:`, { 
          proxy: proxyName, 
          dataType: Array.isArray(data) ? 'array' : typeof data,
          length: Array.isArray(data) ? data.length : 'N/A',
          sample: Array.isArray(data) ? data.slice(0, 2) : data
        });
        
        if (!Array.isArray(data)) {
          throw new Error(`Invalid response format for ${attributeType}: expected array`);
        }

        // Validate and transform the data - handle multiple API response formats
        const validItems: ApiAttribute[] = [];
        
        data.forEach((item: any, index: number) => {
          if (item && typeof item === 'object') {
            // Try first format: codigo/descricao
            if (item.codigo && item.descricao) {
              validItems.push({
                l: item.codigo,
                d: item.descricao
              });
            }
            // Try second format: strCodigo/strDescricao
            else if (item.strCodigo && item.strDescricao) {
              validItems.push({
                l: item.strCodigo,
                d: item.strDescricao
              });
            }
            // Try third format: code/description
            else if (item.code && item.description) {
              validItems.push({
                l: item.code,
                d: item.description
              });
            }
            else {
              console.warn(`[AttributesApiService] Unknown format at index ${index} for ${attributeType}:`, item);
            }
          } else {
            console.warn(`[AttributesApiService] Invalid item at index ${index} for ${attributeType}:`, item);
          }
        });

        console.log(`✅ [AttributesApiService] Success with ${proxyName} for ${attributeType}: ${validItems.length}/${data.length} items`);
        return validItems;
        
      } catch (error) {
        console.error(`❌ [AttributesApiService] ${proxyName} proxy failed for ${attributeType}:`, {
          error: error.message,
          proxyUrl,
          apiUrl
        });
        
        // If this is the last proxy, throw the error
        if (i === proxies.length - 1) {
          throw new Error(`All proxy services failed for ${attributeType}. Last error: ${error.message}`);
        }
        // Otherwise, continue to the next proxy
      }
    }

    // This should never be reached, but just in case
    throw new Error(`No proxy services available for ${attributeType}`);
  }

  clearCache(): void {
    this.cache.clear();
  }

  private getFallbackData(attributeType: string): ApiAttribute[] {
    const fallbacks: { [key: string]: ApiAttribute[] } = {
      modelo: [
        { l: 'Z', d: 'Zoom deck' },
        { l: 'F', d: 'Flat' },
        { l: 'S', d: 'Slim' },
        { l: 'T', d: 'Titanium' },
        { l: 'E', d: 'Ez' }
      ],
      tipo: [
        { l: 'R', d: 'Régua' },
        { l: 'C', d: 'Deck + Clip' },
        { l: 'ML', d: 'Metro Linear' }
      ],
      certificacao: [
        { l: 'S', d: 'Sem' },
        { l: 'F', d: 'FSC' },
        { l: 'P', d: 'PEFC' }
      ]
    };

    return fallbacks[attributeType] || [];
  }
}

export const attributesApiService = new AttributesApiService();
export type { ApiAttribute };