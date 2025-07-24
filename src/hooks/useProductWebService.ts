import { useState, useEffect, useCallback } from 'react';
import { Product } from '@/types/warehouse';
import { apiService, ApiArtigo } from '@/services/apiService';
import { supabase } from '@/integrations/supabase/client';
import { config } from '@/lib/config';
import { useToast } from '@/hooks/use-toast';

interface SyncStatus {
  isLoading: boolean;
  lastSync: Date | null;
  error: string | null;
  totalSynced: number;
}

export const useProductWebService = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isLoading: false,
    lastSync: null,
    error: null,
    totalSynced: 0,
  });
  
  const { toast } = useToast();

  const mapApiArtigoToProduct = (artigo: ApiArtigo): Omit<Product, 'id'> => {
    return {
      familia: 'API',
      modelo: artigo.strCodigo || 'Sem modelo',
      acabamento: 'Standard',
      cor: 'Natural',
      comprimento: 2000,
      foto: artigo.strFoto || undefined,
    };
  };

  const syncProductsToSupabase = async (products: Omit<Product, 'id'>[]): Promise<boolean> => {
    try {
      // Use upsert to handle both inserts and updates
      const { error } = await supabase
        .from('products')
        .upsert(
          products.map(product => ({
            familia: product.familia,
            modelo: product.modelo,
            acabamento: product.acabamento,
            cor: product.cor,
            comprimento: product.comprimento.toString(),
            foto: product.foto || null,
          })),
          {
            onConflict: 'familia,modelo,acabamento,cor,comprimento',
            ignoreDuplicates: false,
          }
        );

      if (error) {
        console.error('Failed to sync products to Supabase:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error syncing products to Supabase:', error);
      return false;
    }
  };

  const syncProducts = useCallback(async (): Promise<boolean> => {
    setSyncStatus(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch data from external API
      const apiArtigos = await apiService.fetchAllArtigos();
      
      if (apiArtigos.length === 0) {
        setSyncStatus(prev => ({
          ...prev,
          isLoading: false,
          error: 'No products found in external API',
        }));
        return false;
      }

      // Map to our Product structure
      const products = apiArtigos.map(mapApiArtigoToProduct);

      // Sync to Supabase
      const syncSuccess = await syncProductsToSupabase(products);

      if (syncSuccess) {
        setSyncStatus({
          isLoading: false,
          lastSync: new Date(),
          error: null,
          totalSynced: products.length,
        });

        if (config.isDevelopment) {
          console.log(`Successfully synced ${products.length} products`);
        }

        toast({
          title: "Sincronização concluída",
          description: `${products.length} produtos sincronizados com sucesso.`,
        });

        return true;
      } else {
        throw new Error('Failed to sync products to Supabase');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setSyncStatus(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      toast({
        title: "Erro na sincronização",
        description: `Falha ao sincronizar produtos: ${errorMessage}`,
        variant: "destructive",
      });

      console.error('Product sync failed:', error);
      return false;
    }
  }, [toast]);

  // Auto-sync on mount if in production
  useEffect(() => {
    if (config.isProduction) {
      syncProducts();
    }
  }, [syncProducts]);

  // Auto-sync every 30 minutes in production
  useEffect(() => {
    if (!config.isProduction) return;

    const interval = setInterval(() => {
      syncProducts();
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, [syncProducts]);

  return {
    syncStatus,
    syncProducts,
    clearCache: apiService.clearCache,
  };
};