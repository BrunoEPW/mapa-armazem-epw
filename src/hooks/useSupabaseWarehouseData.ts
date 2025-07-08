import { useState, useEffect } from 'react';
import { Material, Product, Movement } from '@/types/warehouse';
import { supabase } from '@/lib/supabase';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/storage';
import { mockProducts, mockMaterials, mockMovements } from '@/data/mock-data';
import { toast } from 'sonner';

export const useSupabaseWarehouseData = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

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
          comprimento: product.comprimento,
          foto: product.foto,
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
          posicao: material.location.posicao,
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

  // Load data from Supabase
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('familia', { ascending: true });

      if (productsError) throw productsError;

      // Load materials with product data
      const { data: materialsData, error: materialsError } = await supabase
        .from('materials')
        .select(`
          *,
          products (*)
        `)
        .order('estante', { ascending: true });

      if (materialsError) throw materialsError;

      // Load movements
      const { data: movementsData, error: movementsError } = await supabase
        .from('movements')
        .select('*')
        .order('created_at', { ascending: false });

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
          posicao: m.posicao,
        },
      })) || [];

      const transformedMovements: Movement[] = movementsData?.map(mov => ({
        id: mov.id,
        materialId: mov.material_id,
        type: mov.type,
        pecas: mov.pecas,
        norc: mov.norc,
        date: mov.date,
      })) || [];

      setProducts(transformedProducts);
      setMaterials(transformedMaterials);
      setMovements(transformedMovements);

      console.log('Data loaded from Supabase:', {
        products: transformedProducts.length,
        materials: transformedMaterials.length,
        movements: transformedMovements.length,
      });

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados do Supabase');
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    const initializeData = async () => {
      await migrateLocalStorageData();
      await loadData();
    };
    
    initializeData();
  }, []);

  return {
    materials,
    products,
    movements,
    loading,
    setMaterials,
    setProducts,
    setMovements,
    refreshData: loadData,
  };
};