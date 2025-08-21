import { useState, useEffect } from 'react';
import { Material, Product, Movement } from '@/types/warehouse';
import { supabase } from '@/integrations/supabase/client';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/storage';
import { mockProducts, mockMaterials, mockMovements } from '@/data/mock-data';
import { toast } from 'sonner';
import { config } from '@/lib/config';

export const useSupabaseWarehouseData = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'mock' | 'supabase' | 'error'>('mock');

  // Migrate localStorage data to Supabase (one-time operation)
  const migrateLocalStorageData = async () => {
    try {
      console.log('Checking for localStorage data to migrate...');
      
      // Check if we already migrated
      const migrationCompleted = localStorage.getItem('supabase-migration-completed');
      if (migrationCompleted) {
        console.log('Migration already completed, skipping...');
        return;
      }

      // Get localStorage data
      const localProducts = loadFromStorage(STORAGE_KEYS.PRODUCTS, []);
      const localMaterials = loadFromStorage(STORAGE_KEYS.MATERIALS, []);
      const localMovements = loadFromStorage(STORAGE_KEYS.MOVEMENTS, []);

      if (localProducts.length === 0 && localMaterials.length === 0 && localMovements.length === 0) {
        console.log('No localStorage data to migrate, using mock data...');
        // Use mock data for initial setup
        await migrateProducts(mockProducts);
        await migrateMaterials(mockMaterials);
        await migrateMovements(mockMovements);
      } else {
        console.log('Migrating localStorage data to Supabase...');
        // Migrate existing localStorage data
        await migrateProducts(localProducts);
        await migrateMaterials(localMaterials);
        await migrateMovements(localMovements);
      }

      // Mark migration as completed
      localStorage.setItem('supabase-migration-completed', 'true');
      toast.success('Dados migrados para Supabase com sucesso!');
      
    } catch (error) {
      console.error('Migration error:', error);
      toast.error('Erro na migração dos dados');
    }
  };

  const migrateProducts = async (products: Product[]) => {
    for (const product of products) {
      const { error } = await supabase
        .from('products')
        .upsert({
          id: product.id,
          familia: product.familia,
          modelo: product.modelo,
          acabamento: product.acabamento,
          cor: product.cor,
          comprimento: String(product.comprimento), // Convert to string
          foto: product.foto || null,
        });
      
      if (error) {
        console.error('Error migrating product:', error);
      }
    }
  };

  const migrateMaterials = async (materials: Material[]) => {
    for (const material of materials) {
      const { error } = await supabase
        .from('materials')
        .upsert({
          id: material.id,
          product_id: material.productId,
          pecas: material.pecas,
          estante: material.location.estante,
          prateleira: material.location.prateleira,
          posicao: material.location.posicao || null,
        });
      
      if (error) {
        console.error('Error migrating material:', error);
      }
    }
  };

  const migrateMovements = async (movements: Movement[]) => {
    for (const movement of movements) {
      const { error } = await supabase
        .from('movements')
        .upsert({
          id: movement.id,
          material_id: movement.materialId,
          type: movement.type,
          pecas: movement.pecas,
          norc: movement.norc,
          date: movement.date,
        });
      
      if (error) {
        console.error('Error migrating movement:', error);
      }
    }
  };

  // Load mock data
  const loadMockData = async () => {
    try {
      setLoading(true);
      setDataSource('mock');
      
      console.log('📝 Loading mock data (development mode)');
      
      // Simulate a brief loading period
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProducts(mockProducts);
      setMaterials(mockMaterials);
      setMovements(mockMovements);
      
      console.log('✅ Mock data loaded:', {
        products: mockProducts.length,
        materials: mockMaterials.length,
        movements: mockMovements.length,
      });
      
      toast.success('Dados mock carregados (modo desenvolvimento)');
      
    } catch (error) {
      console.error('Error loading mock data:', error);
      setDataSource('error');
    } finally {
      setLoading(false);
    }
  };

  // Load data from Supabase with timeout and fallback
  const loadSupabaseData = async () => {
    try {
      setLoading(true);
      setDataSource('supabase');
      
      console.log('🔄 Loading data from Supabase...');
      
      // Add timeout to Supabase calls
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Supabase timeout')), 10000)
      );

      // Load products with timeout
      const productsPromise = supabase
        .from('products')
        .select('*')
        .order('familia', { ascending: true });

      const { data: productsData, error: productsError } = await Promise.race([
        productsPromise,
        timeoutPromise
      ]) as any;

      if (productsError) throw productsError;

      // Load materials with product data
      const materialsPromise = supabase
        .from('materials')
        .select(`
          *,
          products (*)
        `)
        .order('estante', { ascending: true });

      const { data: materialsData, error: materialsError } = await Promise.race([
        materialsPromise,
        timeoutPromise
      ]) as any;

      if (materialsError) throw materialsError;

      // Load movements
      const movementsPromise = supabase
        .from('movements')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: movementsData, error: movementsError } = await Promise.race([
        movementsPromise,
        timeoutPromise
      ]) as any;

      if (movementsError) throw movementsError;

      // Transform data to match our types
      const transformedProducts: Product[] = productsData?.map(p => ({
        id: p.id,
        familia: p.familia,
        modelo: p.modelo,
        acabamento: p.acabamento,
        cor: p.cor,
        comprimento: p.comprimento,
        foto: p.foto,
      })) || [];

      const transformedMaterials: Material[] = materialsData?.map(m => ({
        id: m.id,
        productId: m.product_id,
        product: {
          id: m.products.id,
          familia: m.products.familia,
          modelo: m.products.modelo,
          acabamento: m.products.acabamento,
          cor: m.products.cor,
          comprimento: m.products.comprimento,
          foto: m.products.foto,
        },
        pecas: m.pecas,
        location: {
          estante: m.estante,
          prateleira: m.prateleira,
          posicao: (m.posicao as "esquerda" | "central" | "direita") || "central",
        },
      })) || [];

      const transformedMovements: Movement[] = movementsData?.map(mov => ({
        id: mov.id,
        materialId: mov.material_id,
        type: (mov.type as "entrada" | "saida"),
        pecas: mov.pecas,
        norc: mov.norc,
        date: mov.date,
      })) || [];

      setProducts(transformedProducts);
      setMaterials(transformedMaterials);
      setMovements(transformedMovements);

      console.log('✅ Supabase data loaded:', {
        products: transformedProducts.length,
        materials: transformedMaterials.length,
        movements: transformedMovements.length,
      });

    } catch (error) {
      console.error('💥 Supabase error, falling back to mock data:', error);
      setDataSource('error');
      
      // Fallback to mock data
      setProducts(mockProducts);
      setMaterials(mockMaterials);
      setMovements(mockMovements);
      
      toast.error('Erro no Supabase - usando dados mock');
    } finally {
      setLoading(false);
    }
  };

  // Smart data loading based on configuration
  const loadData = async () => {
    if (config.auth.useMockAuth) {
      console.log('🔧 Mock auth enabled - using mock data');
      await loadMockData();
    } else {
      console.log('🏢 Production mode - using Supabase');
      await loadSupabaseData();
    }
  };

  // Load data on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Skip migration in mock mode
        if (!config.auth.useMockAuth) {
          await migrateLocalStorageData();
        }
        await loadData();
      } catch (error) {
        console.error('Error initializing data, falling back to mock data:', error);
        setDataSource('error');
        setProducts(mockProducts);
        setMaterials(mockMaterials);
        setMovements(mockMovements);
        setLoading(false);
      }
    };
    
    initializeData();
  }, []);

  return {
    materials,
    products,
    movements,
    loading,
    dataSource,
    setMaterials,
    setProducts,
    setMovements,
    refreshData: loadData,
  };
};