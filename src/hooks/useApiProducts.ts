import { useState, useEffect, useRef } from 'react';
import { Product } from '@/types/warehouse';
import { apiService } from '@/services/apiService';
import { config } from '@/lib/config';

interface UseApiProductsReturn {
  apiProducts: Product[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useApiProducts = (): UseApiProductsReturn => {
  const [apiProducts, setApiProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const mapApiProductToProduct = (apiProduct: any): Product => {
    const description = apiProduct.strDescricao || '';
    const codigo = apiProduct.strCodigo || '';
    
    if (config.isDevelopment) {
      console.log('Mapping API product:', { Id: apiProduct.Id, strCodigo: codigo, strDescricao: description });
    }
    
    // Enhanced parsing logic for description
    const descParts = description.trim().split(/\s+/);
    let familia = 'API';
    let modelo = codigo;
    let acabamento = 'Standard';
    let cor = 'Natural';
    let comprimento: number | string = 2000;
    
    // Try to extract familia from first part of description
    if (descParts.length > 0 && descParts[0]) {
      familia = descParts[0];
    }
    
    // Try to extract modelo from description or use codigo
    if (descParts.length > 1) {
      modelo = descParts.slice(1, 4).join(' ') || codigo;
    }
    
    // Look for numeric values that might be comprimento
    const numericMatches = description.match(/(\d+(?:mm|cm|m)?)/gi);
    if (numericMatches && numericMatches.length > 0) {
      const firstNumeric = parseInt(numericMatches[0].replace(/[^\d]/g, ''));
      if (firstNumeric > 100) { // Likely a length measurement
        comprimento = firstNumeric;
      }
    }
    
    return {
      id: `api_${apiProduct.Id}`,
      familia: familia || 'API',
      modelo: modelo || codigo || 'Sem Nome',
      acabamento,
      cor,
      comprimento,
      foto: apiProduct.strFoto || undefined,
    };
  };

  const fetchApiProducts = async () => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      console.log('🔍 [useApiProducts] Starting API fetch...');
      
      const apiData = await apiService.fetchAllArtigos();
      
      console.log('📊 [useApiProducts] Raw API response:', {
        length: apiData?.length || 0,
        first3Items: apiData?.slice(0, 3) || [],
        type: typeof apiData,
        isArray: Array.isArray(apiData)
      });
      
      if (!apiData || !Array.isArray(apiData)) {
        throw new Error('API retornou dados inválidos ou nulos');
      }
      
      const mappedProducts = apiData.map(mapApiProductToProduct);
      
      console.log('🔄 [useApiProducts] Mapped products:', {
        length: mappedProducts.length,
        first3: mappedProducts.slice(0, 3)
      });
      
      setApiProducts(mappedProducts);
      
      if (config.isDevelopment) {
        console.log(`✅ [useApiProducts] Successfully loaded ${mappedProducts.length} products from API`);
      }
    } catch (err) {
      console.error('❌ [useApiProducts] Error details:', {
        error: err,
        name: err instanceof Error ? err.name : 'Unknown',
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      });
      
      if (err instanceof Error && err.name !== 'AbortError') {
        let errorMessage = 'Erro ao conectar com a API de produtos';
        
        // More specific error handling
        if (err.message.includes('fetch') || err.name === 'TypeError') {
          errorMessage = 'CORS/Network: Não foi possível conectar à API. Verifique se a API está online.';
        } else if (err.message.includes('timeout') || err.message.includes('AbortError')) {
          errorMessage = 'Timeout: A API demorou muito para responder.';
        } else if (err.message.includes('404')) {
          errorMessage = 'API não encontrada: Endpoint não existe.';
        } else if (err.message.includes('500')) {
          errorMessage = 'Erro interno da API: Servidor com problemas.';
        } else if (err.message.includes('inválidos')) {
          errorMessage = err.message;
        }
        
        console.log('🚨 [useApiProducts] Setting error message:', errorMessage);
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
      console.log('🏁 [useApiProducts] Fetch completed');
    }
  };

  useEffect(() => {
    fetchApiProducts();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    apiProducts,
    loading,
    error,
    refresh: fetchApiProducts,
  };
};