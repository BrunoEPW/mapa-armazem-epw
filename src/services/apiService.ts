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
  Cor?: string;
  Acabamento?: string;
  Comprimento?: string;
}

interface ProxyStatus {
  name: string;
  lastSuccess: number;
  lastFailure: number;
  failureCount: number;
  isBlocked: boolean;
}

class ApiService {
  private originalApiUrl = 'https://pituxa.epw.pt/api/artigos';
  // Cache removed - no caching enabled
  
  // Circuit breaker para proxies
  private proxyStatuses = new Map<string, ProxyStatus>();
  private circuitBreakerTimeout = 5 * 60 * 1000; // 5 minutes
  
  // Request queue para limitare requisições simultâneas
  private activeRequests = new Set<string>();
  private maxConcurrentRequests = 2;
  private requestQueue = new Map<string, { resolve: Function; reject: Function; params: any }>();
  
  // Timeouts e retry
  private defaultTimeout = 30000; // 30 segundos
  private maxRetries = 3;
  
  // Cache disabled - no persistent cache

  async fetchArtigos(draw: number = 1, start: number = 0, length: number = 10): Promise<ApiArtigo[]> {
    const result = await this.fetchArtigosWithTotal(draw, start, length);
    return result.data;
  }

  async fetchArtigosWithTotal(draw: number = 1, start: number = 0, length: number = 10, filters?: ApiFilters): Promise<ApiResponse> {
    console.log('🚀 [ApiService] Making fresh API call - no cache enabled');
    
    // Direct call without cache
    return this.queueRequest(`${start}-${length}`, async () => {
      return this.makeRequestWithRetry(draw, start, length, filters);
    });

  }
  
  private async queueRequest(cacheKey: string, requestFn: () => Promise<ApiResponse>): Promise<ApiResponse> {
    // Se já está na fila, aguardar
    if (this.requestQueue.has(cacheKey)) {
      return new Promise((resolve, reject) => {
        const existing = this.requestQueue.get(cacheKey);
        this.requestQueue.set(cacheKey, {
          resolve: (result: ApiResponse) => {
            existing?.resolve(result);
            resolve(result);
          },
          reject: (error: Error) => {
            existing?.reject(error);
            reject(error);
          },
          params: null
        });
      });
    }

    // Se excedeu limite de requisições simultâneas, aguardar
    while (this.activeRequests.size >= this.maxConcurrentRequests) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.activeRequests.add(cacheKey);

    try {
      const result = await requestFn();
      
      // No caching - just return result
      console.log('✅ [ApiService] Fresh API call completed successfully');

      // Resolver requisições na fila
      const queued = this.requestQueue.get(cacheKey);
      if (queued) {
        queued.resolve(result);
        this.requestQueue.delete(cacheKey);
      }

      return result;
    } catch (error) {
      console.error('❌ [ApiService] Fetch error:', error);
      
      // Rejeitar requisições na fila
      const queued = this.requestQueue.get(cacheKey);
      if (queued) {
        queued.reject(error);
        this.requestQueue.delete(cacheKey);
      }
      
      // No fallback cache - throw error directly
      throw error;
    } finally {
      this.activeRequests.delete(cacheKey);
    }
  }

  private async makeRequestWithRetry(draw: number, start: number, length: number, filters?: ApiFilters): Promise<ApiResponse> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const timeout = this.defaultTimeout + (attempt - 1) * 10000; // Timeout progressivo
        console.log(`🔄 [ApiService] Attempt ${attempt}/${this.maxRetries} with ${timeout}ms timeout`);
        
        return await this.makeRequest(draw, start, length, filters, timeout);
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ [ApiService] Attempt ${attempt} failed:`, error.message);
        
        if (attempt < this.maxRetries) {
          const backoff = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
          console.log(`⏳ [ApiService] Waiting ${backoff}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, backoff));
        }
      }
    }
    
    throw lastError;
  }

  private async makeRequest(draw: number, start: number, length: number, filters?: ApiFilters, timeout: number = this.defaultTimeout): Promise<ApiResponse> {
    console.log(`🌐 [ApiService] Making API request with ${timeout}ms timeout`);
    console.log(`🎯 [ApiService] Request parameters: draw=${draw}, start=${start}, length=${length}, filters=`, filters);
    
    // 🐛 DEBUG: Try minimal URL format first when no filters (as suggested by user)
    if (!filters || Object.keys(filters).length === 0) {
      const minimalUrl = `${this.originalApiUrl}?start=${start}&length=${length}&order[0][column]=1&order[0][dir]=ASC`;
      console.log(`🚀 [ApiService] TESTING MINIMAL URL (user suggested format):`, minimalUrl);
      
      try {
        console.log('🔬 [ApiService] Trying minimal URL format (no draw parameter)...');
        const response = await this.fetchWithTimeout(minimalUrl, timeout);
        const data = await response.json();
        
        console.log('🎉 [ApiService] MINIMAL URL SUCCESS! Response data:', {
          draw: data.draw,
          recordsTotal: data.recordsTotal,
          recordsFiltered: data.recordsFiltered,
          dataLength: data.data?.length || 0,
          firstFewItems: data.data?.slice(0, 3)?.map((item: any) => ({ Id: item.Id, codigo: item.strCodigo })) || []
        });

        return {
          draw: data.draw || draw,
          recordsTotal: data.recordsTotal || 0,
          recordsFiltered: data.recordsFiltered || 0,
          data: data.data || []
        };
      } catch (error) {
        console.warn('⚠️ [ApiService] Minimal URL failed, trying standard format:', error.message);
      }
    }
    
    // Build the original API URL with parameters (standard format)
    const apiUrl = new URL(this.originalApiUrl);
    apiUrl.searchParams.set('draw', draw.toString());
    apiUrl.searchParams.set('start', start.toString());
    apiUrl.searchParams.set('length', length.toString());
    
    // Add ordering parameters for consistent results
    apiUrl.searchParams.set('order[0][column]', '1');
    apiUrl.searchParams.set('order[0][dir]', 'ASC');
    
    // Add filter parameters if provided
    if (filters) {
      console.log(`🔧 [ApiService] Adding filters to URL:`, filters);
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== 'all') {
          console.log(`📌 [ApiService] Adding filter: ${key} = ${value}`);
          apiUrl.searchParams.set(key, value);
        }
      });
    }
    
    console.log(`🌐 [ApiService] Final API URL (standard):`, apiUrl.toString());

    // Tentar primeiro a API direta (firewall desativada)
    try {
      console.log('🔄 [ApiService] Trying direct API call (no proxy)...');
      const response = await this.fetchWithTimeout(apiUrl.toString(), timeout);
      const data = await response.json();
      
        console.log('✅ [ApiService] Success with direct API call:', {
          draw: data.draw,
          recordsTotal: data.recordsTotal,
          recordsFiltered: data.recordsFiltered,
          dataLength: data.data?.length || 0,
          firstFewItems: data.data?.slice(0, 3)?.map((item: any) => ({ Id: item.Id, codigo: item.strCodigo })) || [],
          emptyDataWarning: data.data?.length === 0 && data.recordsFiltered > 0 ? '⚠️ API claims products exist but returns empty data!' : null
        });

      return {
        draw: data.draw || draw,
        recordsTotal: data.recordsTotal || 0,
        recordsFiltered: data.recordsFiltered || 0,
        data: data.data || []
      };
    } catch (error) {
      console.warn('⚠️ [ApiService] Direct API failed, trying proxies:', error.message);
    }

    // Try proxies with circuit breaker
    const proxies = [
      { url: `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl.toString())}`, name: 'allorigins' },
      { url: `https://corsproxy.io/?${encodeURIComponent(apiUrl.toString())}`, name: 'corsproxy' },
      { url: `https://cors-anywhere.herokuapp.com/${apiUrl.toString()}`, name: 'cors-anywhere' }
    ];
    
    // Filtrar proxies baseado no circuit breaker
    const availableProxies = this.getAvailableProxies(proxies);

    for (const proxy of availableProxies) {
      try {
        console.log(`🔄 [ApiService] Trying ${proxy.name} proxy...`);
        
        const response = await this.fetchWithTimeout(proxy.url, timeout);
        
        let data;
        if (proxy.name === 'allorigins') {
          // allorigins wraps the response in a contents field
          const wrapper = await response.json();
          data = JSON.parse(wrapper.contents);
        } else {
          data = await response.json();
        }
        
        console.log(`✅ [ApiService] Success with ${proxy.name} proxy:`, {
          draw: data.draw,
          recordsTotal: data.recordsTotal,
          recordsFiltered: data.recordsFiltered,
          dataLength: data.data?.length || 0,
          firstFewItems: data.data?.slice(0, 3)?.map((item: any) => ({ Id: item.Id, codigo: item.strCodigo })) || [],
          emptyDataWarning: data.data?.length === 0 && data.recordsFiltered > 0 ? '⚠️ API claims products exist but returns empty data!' : null
        });

        // Marcar proxy como bem sucedido
        this.markProxySuccess(proxy.name);

        return {
          draw: data.draw || draw,
          recordsTotal: data.recordsTotal || 0,
          recordsFiltered: data.recordsFiltered || 0,
          data: data.data || []
        };
        
      } catch (error) {
        console.warn(`⚠️ [ApiService] ${proxy.name} proxy failed:`, error.message);
        this.markProxyFailure(proxy.name);
      }
    }

    // Se todos falharam
    throw new Error(`All proxy services failed or are circuit-broken`);
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
    console.log(`✅ [ApiService] Proxy ${proxyName} marked as successful`);
  }

  private markProxyFailure(proxyName: string): void {
    const status = this.getProxyStatus(proxyName);
    status.lastFailure = Date.now();
    status.failureCount++;
    
    // Bloquear proxy se falhar mais de 3 vezes consecutivas
    if (status.failureCount >= 3) {
      status.isBlocked = true;
      console.warn(`🚫 [ApiService] Proxy ${proxyName} circuit-broken (${status.failureCount} failures)`);
    }
  }

  // Cache methods removed - no caching enabled

  async fetchAllArtigos(): Promise<ApiArtigo[]> {
    try {
      // Start with a small request to get total count
      const initialResponse = await this.fetchArtigosWithTotal(1, 0, 10);
      const totalRecords = initialResponse.recordsTotal;
      console.log(`📊 [ApiService] Total records available: ${totalRecords}`);
      
      if (totalRecords <= 4000) {
        // If total is manageable, fetch all at once
        console.log(`📥 [ApiService] Fetching all ${totalRecords} records in one request`);
        return await this.fetchArtigos(1, 0, totalRecords);
      } else {
        // If too many records, fetch in batches
        console.log(`📥 [ApiService] Fetching ${totalRecords} records in batches`);
        return await this.fetchAllArtigosInBatches(totalRecords);
      }
    } catch (error) {
      console.error('Failed to fetch all artigos:', error);
      return [];
    }
  }

  private async fetchAllArtigosInBatches(totalRecords: number, batchSize: number = 2000): Promise<ApiArtigo[]> {
    const allProducts: ApiArtigo[] = [];
    let currentStart = 0;

    while (currentStart < totalRecords) {
      const remainingRecords = totalRecords - currentStart;
      const currentBatchSize = Math.min(batchSize, remainingRecords);
      
      console.log(`📥 [ApiService] Fetching batch: ${currentStart} to ${currentStart + currentBatchSize} of ${totalRecords}`);
      
      try {
        const batchProducts = await this.fetchArtigos(1, currentStart, currentBatchSize);
        allProducts.push(...batchProducts);
        currentStart += currentBatchSize;
        
        // Small delay between batches to avoid overwhelming the API
        if (currentStart < totalRecords) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`❌ [ApiService] Error fetching batch starting at ${currentStart}:`, error);
        break;
      }
    }

    console.log(`✅ [ApiService] Successfully fetched ${allProducts.length} products in batches`);
    return allProducts;
  }

  // Find product by code with complete search
  async findProductByCode(productCode: string): Promise<ApiArtigo | null> {
    console.log(`🔍 [ApiService] Searching for product with code: ${productCode}`);
    
    try {
      // First try to fetch with filters (if API supports it)
      const response = await this.fetchArtigosWithTotal(1, 0, 1000, {
        strCodigo: productCode
      } as any);
      
      // Look for exact match in the response
      const exactMatch = response.data?.find(item => 
        item.strCodigo === productCode
      );
      
      if (exactMatch) {
        console.log(`✅ [ApiService] Found exact match for ${productCode}:`, exactMatch);
        return exactMatch;
      }
      
      // If no exact match found with filters, do a complete search
      console.log(`🔍 [ApiService] No exact match found with filters, searching all products...`);
      const allProducts = await this.fetchAllArtigos();
      
      const completeMatch = allProducts.find(item => 
        item.strCodigo === productCode
      );
      
      if (completeMatch) {
        console.log(`✅ [ApiService] Found match in complete search for ${productCode}:`, completeMatch);
        return completeMatch;
      }
      
      console.log(`❌ [ApiService] No product found with code: ${productCode} (searched ${allProducts.length} products)`);
      return null;
      
    } catch (error) {
      console.error(`❌ [ApiService] Error searching for product ${productCode}:`, error);
      return null;
    }
  }

  // Batch verification of multiple product codes
  async verifyProductCodes(productCodes: string[]): Promise<{
    found: { code: string; product: ApiArtigo }[];
    notFound: string[];
    totalSearched: number;
  }> {
    console.log(`🔍 [ApiService] Verifying ${productCodes.length} product codes...`);
    
    try {
      // Fetch all products once for batch verification
      const allProducts = await this.fetchAllArtigos();
      console.log(`📊 [ApiService] Searching through ${allProducts.length} products`);
      
      const found: { code: string; product: ApiArtigo }[] = [];
      const notFound: string[] = [];
      
      for (const code of productCodes) {
        const product = allProducts.find(item => item.strCodigo === code);
        
        if (product) {
          console.log(`✅ [ApiService] Found ${code}`);
          found.push({ code, product });
        } else {
          console.log(`❌ [ApiService] Not found: ${code}`);
          notFound.push(code);
        }
      }
      
      const result = {
        found,
        notFound,
        totalSearched: allProducts.length
      };
      
      console.log(`📊 [ApiService] Verification complete:`, {
        found: found.length,
        notFound: notFound.length,
        totalSearched: allProducts.length
      });
      
      return result;
      
    } catch (error) {
      console.error(`❌ [ApiService] Error verifying product codes:`, error);
      return {
        found: [],
        notFound: productCodes,
        totalSearched: 0
      };
    }
  }

  clearCache(): void {
    console.log('🧹 [ApiService] No cache to clear - caching disabled');
    this.activeRequests.clear();
    this.requestQueue.clear();
    this.proxyStatuses.clear();
  }

  private generateCacheKey(start: number, length: number, filters?: ApiFilters): string {
    const filterKey = filters ? JSON.stringify(filters) : '';
    return `${start}-${length}-${filterKey}`;
  }
}

export const apiService = new ApiService();
export type { ApiArtigo, ApiResponse, ApiFilters };