import { supabase } from '@/integrations/supabase/client';

interface ApiAttribute {
  l: string; // Letter/Code
  d: string; // Description
}

interface ProxyStatus {
  name: string;
  lastSuccess: number;
  lastFailure: number;
  failureCount: number;
  isBlocked: boolean;
}

class AttributesApiService {
  private baseApiUrl = 'https://pituxa.epw.pt/api/atributos';
  // Cache removed - no caching enabled
  
  // Circuit breaker para proxies
  private proxyStatuses = new Map<string, ProxyStatus>();
  private circuitBreakerTimeout = 5 * 60 * 1000; // 5 minutes
  
  // Request queue
  private activeRequests = new Set<string>();
  private maxConcurrentRequests = 2;
  
  // Timeouts e retry
  private defaultTimeout = 30000; // 30 segundos
  private maxRetries = 3;
  
  // Cache disabled - no persistent cache

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
    console.log(`🚀 [AttributesApiService] Making fresh API call for ${attributeType} - no cache enabled`);
    
    // Limitar requisições simultâneas
    while (this.activeRequests.size >= this.maxConcurrentRequests) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.activeRequests.add(attributeType);

    try {
      const result = await this.makeRequestWithRetry(attributeType);
      console.log(`✅ [AttributesApiService] Fresh API call for ${attributeType} completed successfully`);
      return result;
    } catch (error) {
      console.error(`❌ [AttributesApiService] Fetch ${attributeType} error:`, error);
      
      // Fallback to basic static data for critical attributes
      const fallbackData = this.getFallbackData(attributeType);
      if (fallbackData.length > 0) {
        console.warn(`🔄 [AttributesApiService] Using fallback data for ${attributeType}: ${fallbackData.length} items`);
        return fallbackData;
      }
      
      throw error;
    } finally {
      this.activeRequests.delete(attributeType);
    }
  }

  private async makeRequestWithRetry(attributeType: string): Promise<ApiAttribute[]> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const timeout = this.defaultTimeout + (attempt - 1) * 10000; // Timeout progressivo
        console.log(`🔄 [AttributesApiService] Attempt ${attempt}/${this.maxRetries} for ${attributeType} with ${timeout}ms timeout`);
        
        return await this.makeRequest(attributeType, timeout);
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ [AttributesApiService] Attempt ${attempt} failed for ${attributeType}:`, error.message);
        
        if (attempt < this.maxRetries) {
          const backoff = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
          console.log(`⏳ [AttributesApiService] Waiting ${backoff}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, backoff));
        }
      }
    }
    
    throw lastError;
  }

  private async makeRequest(attributeType: string, timeout: number = this.defaultTimeout): Promise<ApiAttribute[]> {
    console.log(`🌐 [AttributesApiService] Fetching ${attributeType} with ${timeout}ms timeout`);
    
    const apiUrl = `${this.baseApiUrl}/${attributeType}`;
    
    // Tentar primeiro a API direta (firewall desativada)
    try {
      console.log(`🔄 [AttributesApiService] Trying direct API call for ${attributeType}...`);
      const response = await this.fetchWithTimeout(apiUrl, timeout);
      const data = await response.json();
      
      console.log(`✅ [AttributesApiService] Success with direct API for ${attributeType}:`, data.length, 'items');
      return this.processAttributeData(data, attributeType);
    } catch (error) {
      console.warn(`⚠️ [AttributesApiService] Direct API failed for ${attributeType}, trying proxies:`, error.message);
    }
    
    // Try proxies with circuit breaker
    const proxies = [
      { url: `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`, name: 'allorigins' },
      { url: `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`, name: 'corsproxy' },
      { url: `https://cors-anywhere.herokuapp.com/${apiUrl}`, name: 'cors-anywhere' }
    ];
    
    // Filtrar proxies baseado no circuit breaker
    const availableProxies = this.getAvailableProxies(proxies);

    for (const proxy of availableProxies) {
      try {
        console.log(`🔄 [AttributesApiService] Trying ${proxy.name} proxy for ${attributeType}...`);
        
        const response = await this.fetchWithTimeout(proxy.url, timeout);
        
        let data;
        if (proxy.name === 'allorigins') {
          // allorigins wraps the response in a contents field
          const wrapper = await response.json();
          data = JSON.parse(wrapper.contents);
        } else {
          data = await response.json();
        }
        
        console.log(`📊 [AttributesApiService] Raw data received for ${attributeType}:`, { 
          proxy: proxy.name, 
          dataType: Array.isArray(data) ? 'array' : typeof data,
          length: Array.isArray(data) ? data.length : 'N/A',
          sample: Array.isArray(data) ? data.slice(0, 2) : data
        });
        
        if (!Array.isArray(data)) {
          throw new Error(`Invalid response format for ${attributeType}: expected array`);
        }

        // Marcar proxy como bem sucedido
        this.markProxySuccess(proxy.name);

        const validItems = this.processAttributeData(data, attributeType);
        console.log(`✅ [AttributesApiService] Success with ${proxy.name} for ${attributeType}: ${validItems.length}/${data.length} items`);
        return validItems;
        
      } catch (error) {
        console.error(`❌ [AttributesApiService] ${proxy.name} proxy failed for ${attributeType}:`, {
          error: error.message,
          proxyUrl: proxy.url,
          apiUrl
        });
        
        this.markProxyFailure(proxy.name);
      }
    }

    // Se todos falharam
    throw new Error(`All proxy services failed or are circuit-broken for ${attributeType}`);

  }
  
  private processAttributeData(data: any[], attributeType: string): ApiAttribute[] {
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

    return validItems;
  }

  private async fetchWithTimeout(url: string, timeout: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private getAvailableProxies(allProxies: { url: string; name: string }[]): { url: string; name: string }[] {
    const now = Date.now();
    return allProxies
      .map(proxy => ({ ...proxy, status: this.getProxyStatus(proxy.name) }))
      .filter(proxy => !proxy.status.isBlocked || (now - proxy.status.lastFailure) > this.circuitBreakerTimeout)
      .sort((a, b) => {
        // Priorizar proxies que funcionaram recentemente
        if (a.status.lastSuccess > b.status.lastSuccess) return -1;
        if (a.status.lastSuccess < b.status.lastSuccess) return 1;
        return a.status.failureCount - b.status.failureCount;
      });
  }

  private getProxyStatus(proxyName: string): ProxyStatus {
    if (!this.proxyStatuses.has(proxyName)) {
      this.proxyStatuses.set(proxyName, {
        name: proxyName,
        lastSuccess: 0,
        lastFailure: 0,
        failureCount: 0,
        isBlocked: false
      });
    }
    return this.proxyStatuses.get(proxyName)!;
  }

  private markProxySuccess(proxyName: string): void {
    const status = this.getProxyStatus(proxyName);
    status.lastSuccess = Date.now();
    status.failureCount = 0;
    status.isBlocked = false;
    console.log(`✅ [AttributesApiService] Proxy ${proxyName} marked as successful`);
  }

  private markProxyFailure(proxyName: string): void {
    const status = this.getProxyStatus(proxyName);
    status.lastFailure = Date.now();
    status.failureCount++;
    
    // Bloquear proxy se falhar mais de 3 vezes consecutivas
    if (status.failureCount >= 3) {
      status.isBlocked = true;
      console.warn(`🚫 [AttributesApiService] Proxy ${proxyName} circuit-broken (${status.failureCount} failures)`);
    }
  }

  clearCache(): void {
    console.log('🧹 [AttributesApiService] No cache to clear - caching disabled');
    this.activeRequests.clear();
    this.proxyStatuses.clear();
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