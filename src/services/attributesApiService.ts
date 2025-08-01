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
      
      throw error;
    }
  }

  private async makeRequest(attributeType: string): Promise<ApiAttribute[]> {
    console.log(`🌐 [AttributesApiService] Fetching ${attributeType} via Supabase Edge Function`);
    
    const apiUrl = `${this.baseApiUrl}/${attributeType}`;
    
    try {
      const { data, error } = await supabase.functions.invoke('epw-api-proxy', {
        body: { url: apiUrl },
      });

      if (error) {
        throw new Error(`Supabase function error: ${error.message}`);
      }

      console.log(`📋 [AttributesApiService] Raw response for ${attributeType}:`, {
        type: typeof data,
        isArray: Array.isArray(data),
        length: data?.length || 0
      });

      if (!Array.isArray(data)) {
        throw new Error(`Invalid response format for ${attributeType}: expected array`);
      }

      // Validate and transform the data
      const validItems: ApiAttribute[] = [];
      
      data.forEach((item: any, index: number) => {
        if (item && typeof item === 'object' && item.codigo && item.descricao) {
          validItems.push({
            l: item.codigo,
            d: item.descricao
          });
        } else {
          console.warn(`[AttributesApiService] Invalid item at index ${index} for ${attributeType}:`, item);
        }
      });

      console.log(`✅ [AttributesApiService] Successfully processed ${validItems.length}/${data.length} items for ${attributeType}`);
      return validItems;

    } catch (error) {
      console.error(`❌ [AttributesApiService] Error fetching ${attributeType}:`, error);
      throw new Error(`Failed to fetch ${attributeType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const attributesApiService = new AttributesApiService();
export type { ApiAttribute };