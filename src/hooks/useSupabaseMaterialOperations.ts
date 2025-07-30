
import { Material, Product } from '@/types/warehouse';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useAuditLog } from '@/hooks/useAuditLog';
import { config } from '@/lib/config';
import { isValidUUID, ensureValidProductId } from '@/utils/uuidUtils';

interface UseSupabaseMaterialOperationsProps {
  materials: Material[];
  setMaterials: React.Dispatch<React.SetStateAction<Material[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

export const useSupabaseMaterialOperations = ({
  materials,
  setMaterials,
  products,
  setProducts,
}: UseSupabaseMaterialOperationsProps) => {
  const auth = useAuth();
  const { logAction } = useAuditLog();
  
  // Only access user/permissions when auth context is ready
  const user = auth?.user || null;
  
  const addMaterial = async (material: Omit<Material, 'id'>): Promise<Material> => {
    console.log('🔍 [addMaterial] Starting with material:', material);
    
    if (!user && !config.auth.useMockAuth) {
      console.error('🔴 [addMaterial] No authenticated user');
      toast.error('Utilizador não autenticado');
      throw new Error('Utilizador não autenticado');
    }

    try {
      // Step 1: Validate and fix product ID if needed
      let validProductId = material.productId;
      if (!isValidUUID(material.productId)) {
        console.log('⚠️ [addMaterial] Invalid UUID detected, generating valid one:', material.productId);
        validProductId = ensureValidProductId(material.productId);
        console.log('✅ [addMaterial] Generated valid UUID:', validProductId);
      }

      // Step 2: Ensure product exists in database or local state
      let productExists = products.some(p => p.id === validProductId);
      
      if (!productExists) {
        console.log('⚠️ [addMaterial] Product not found locally, checking database...');
        
        const { data: dbProduct } = await supabase
          .from('products')
          .select('*')
          .eq('id', validProductId)
          .single();

        if (!dbProduct) {
          console.log('⚠️ [addMaterial] Product not in database, creating from material data...');
          
          // Create product from material data
          const productToCreate = {
            id: validProductId,
            familia: material.product.familia,
            modelo: material.product.modelo,
            acabamento: material.product.acabamento,
            cor: material.product.cor,
            comprimento: String(material.product.comprimento),
            foto: material.product.foto || undefined,
            codigo: material.product.codigo || undefined,
            descricao: material.product.descricao || undefined,
          };

          try {
            const { error: productError } = await supabase
              .from('products')
              .insert(productToCreate);

            if (productError) {
              console.log('⚠️ [addMaterial] Failed to create product in DB, using local fallback');
              // Add to local state only
              setProducts(prev => [...prev, productToCreate]);
            } else {
              console.log('✅ [addMaterial] Product created in database');
              setProducts(prev => [...prev, productToCreate]);
            }
          } catch (productCreationError) {
            console.log('⚠️ [addMaterial] Product creation failed, using local fallback');
            setProducts(prev => [...prev, productToCreate]);
          }
        }
      }

      console.log('💾 [addMaterial] Inserting material into Supabase...');
      
      // Prepare data for insertion with valid product ID
      const materialData = {
        product_id: validProductId,
        pecas: material.pecas,
        estante: material.location.estante,
        prateleira: material.location.prateleira,
        posicao: material.location.posicao || null,
        created_by: user?.id || 'mock-user-id',
      };
      
      console.log('📝 [addMaterial] Material data for insertion:', materialData);
      
      const { data, error } = await supabase
        .from('materials')
        .insert([materialData])
        .select()
        .single();

      if (error) {
        console.error('🔴 [addMaterial] Supabase error:', error);
        
        // If it's an RLS or foreign key error, create locally
        if (error.message?.includes('row-level security') || 
            error.message?.includes('foreign key') ||
            error.code === '42501' || 
            error.code === '23503') {
          console.log('⚠️ [addMaterial] Database restricted, creating material locally');
          
          const localMaterial: Material = {
            id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            productId: validProductId,
            product: {
              ...material.product,
              id: validProductId
            },
            pecas: material.pecas,
            location: material.location,
          };

          setMaterials(prev => [...prev, localMaterial]);
          toast.success('Material adicionado localmente!');
          return localMaterial;
        }
        
        throw error;
      }

      if (!data) {
        console.error('🔴 [addMaterial] No data returned from insert');
        throw new Error('Nenhum dado retornado da inserção');
      }

      console.log('✅ [addMaterial] Successfully inserted:', data);
      
      // Create the complete material object
      const newMaterial: Material = {
        id: data.id,
        productId: validProductId,
        product: {
          ...material.product,
          id: validProductId
        },
        pecas: data.pecas,
        location: {
          estante: data.estante,
          prateleira: data.prateleira,
          posicao: (data.posicao as 'esquerda' | 'central' | 'direita') || undefined,
        },
      };

      console.log('📦 [addMaterial] Created complete material object:', newMaterial);

      // Update local state
      setMaterials(prev => [...prev, newMaterial]);
      
      // Log the action for audit trail
      await logAction('materials', newMaterial.id, 'INSERT', undefined, {
        product_id: newMaterial.productId,
        pecas: newMaterial.pecas,
        location: newMaterial.location,
      });

      toast.success('Material adicionado com sucesso!');
      console.log('✅ [addMaterial] Operation completed successfully');
      
      return newMaterial;
    } catch (error) {
      console.error('🔴 [addMaterial] Error:', error);
      toast.error('Erro ao adicionar material. Tente novamente.');
      throw error;
    }
  };

  const removeMaterial = async (materialId: string) => {
    try {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', materialId);

      if (error) throw error;

      setMaterials(prev => prev.filter(m => m.id !== materialId));
      toast.success('Material removido com sucesso');
      
    } catch (error) {
      console.error('Error removing material:', error);
      toast.error('Erro ao remover material');
    }
  };

  const updateMaterial = async (materialId: string, updates: Partial<Material>): Promise<void> => {
    console.log('🔄 [updateMaterial] Starting update for material:', materialId, 'with updates:', updates);
    
    try {
      const updateData: any = {};
      
      if (updates.pecas !== undefined) updateData.pecas = updates.pecas;
      if (updates.location) {
        updateData.estante = updates.location.estante;
        updateData.prateleira = updates.location.prateleira;
        updateData.posicao = updates.location.posicao;
      }

      console.log('💾 [updateMaterial] Updating in Supabase with data:', updateData);

      const { data, error } = await supabase
        .from('materials')
        .update(updateData)
        .eq('id', materialId)
        .select()
        .single();

      if (error) {
        console.error('🔴 [updateMaterial] Supabase error:', error);
        
        // If it's an RLS or permission error, update locally only
        if (error.message?.includes('row-level security') || 
            error.code === '42501') {
          console.log('⚠️ [updateMaterial] Database restricted, updating locally only');
          
          setMaterials(prev => prev.map(m => 
            m.id === materialId ? { ...m, ...updates } : m
          ));
          
          toast.success('Material atualizado localmente!');
          console.log('✅ [updateMaterial] Updated locally successfully');
          return;
        }
        
        throw error;
      }

      console.log('✅ [updateMaterial] Supabase update successful:', data);

      // Update local state
      setMaterials(prev => prev.map(m => 
        m.id === materialId ? { ...m, ...updates } : m
      ));
      
      // Log the action
      await logAction('materials', materialId, 'UPDATE', undefined, updates);
      
      toast.success('Material atualizado com sucesso!');
      console.log('✅ [updateMaterial] Operation completed successfully');
      
    } catch (error) {
      console.error('🔴 [updateMaterial] Error:', error);
      toast.error('Erro ao atualizar material. Tente novamente.');
      throw error;
    }
  };

  return {
    addMaterial,
    removeMaterial,
    updateMaterial,
  };
};
