import React, { createContext, useContext, useState, useEffect } from 'react';
import { Material, Product, Movement, ShelfData, ShelfLocation } from '@/types/warehouse';

import { useSupabaseWarehouseData } from '@/hooks/useSupabaseWarehouseData';
import { useSupabaseWarehouseOperations } from '@/hooks/useSupabaseWarehouseOperations';
import { useRealTimeSync } from '@/hooks/useRealTimeSync';
import { useDataReset } from '@/hooks/useDataReset';
import { useSupabaseAdminOperations } from '@/hooks/useSupabaseAdminOperations';
import { useProductWebService } from '@/hooks/useProductWebService';
import { decodeEPWReference } from '@/utils/epwCodeDecoder';
import { ensureValidProductId } from '@/utils/uuidUtils';
import { toast } from 'sonner';

interface WarehouseContextType {
  materials: Material[];
  products: Product[];
  movements: Movement[];
  selectedShelf: ShelfLocation | null;
  loading: boolean;
  addMaterial: (material: Omit<Material, 'id'>) => Promise<Material>;
  removeMaterial: (materialId: string) => Promise<void>;
  updateMaterial: (materialId: string, updates: Partial<Material>) => Promise<void>;
  addMovement: (movement: Omit<Movement, 'id'>) => Promise<void>;
  getMaterialsByShelf: (location: ShelfLocation) => Material[];
  getShelfData: (location: ShelfLocation) => ShelfData;
  searchMaterials: (query: { familia?: string; modelo?: string; acabamento?: string; comprimento?: number }) => Material[];
  setSelectedShelf: (location: ShelfLocation | null) => void;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (productId: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  clearAllData: () => Promise<boolean>;
  clearDataPreservingMaterials: () => Promise<boolean>;
  clearAllMaterials: () => Promise<boolean>;
  createProductFromApi: (apiProduct: any) => Promise<Product>;
  syncProducts: () => Promise<boolean>;
  populateTestData: () => Promise<any>;
  syncStatus: {
    isLoading: boolean;
    lastSync: Date | null;
    error: string | null;
    totalSynced: number;
  };
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

export const WarehouseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // All useState calls first
  const [selectedShelf, setSelectedShelf] = useState<ShelfLocation | null>(null);
  
  // No authentication required
  
  // All hooks must be called consistently
  const { materials, products, movements, loading, setMaterials, setProducts, setMovements, refreshData } = useSupabaseWarehouseData();
  const { clearAllData, clearDataPreservingMaterials } = useDataReset(setMaterials, setProducts, setMovements);
  
  // Operations without auth checks for development
  const operations = useSupabaseWarehouseOperations({
    materials,
    products,
    movements,
    setMaterials,
    setProducts,
    setMovements,
    refreshData,
  });
  
  const adminOps = useSupabaseAdminOperations();
  const { syncStatus, syncProducts } = useProductWebService();
  
  // Enable real-time synchronization
  useRealTimeSync(refreshData, refreshData, refreshData);

  const createProductFromApi = async (apiProduct: any): Promise<Product> => {
    
    try {
      // Step 1: Validate input data
      if (!apiProduct) {
        throw new Error('Dados do produto não fornecidos');
      }

      

      // Step 2: Generate valid UUID from API product ID
      if (!apiProduct.id && !apiProduct.codigo) {
        throw new Error('ID ou código do produto em falta');
      }
      
      const apiId = apiProduct.id || apiProduct.codigo || `temp-${Date.now()}`;
      const cleanId = ensureValidProductId(apiId);
      console.log('🆔 Generated valid UUID:', cleanId, 'from API ID:', apiId);
      
      // Check if product already exists
      const existingProduct = products.find(p => p.id === cleanId);
      if (existingProduct) {
        console.log('ℹ️ Product already exists locally, returning existing:', existingProduct);
        return existingProduct;
      }

      // Step 3: Create safe field values with robust fallbacks
      const safeString = (value: any, defaultValue: string = 'Indefinido'): string => {
        if (value === null || value === undefined || value === '') {
          return defaultValue;
        }
        const stringValue = String(value).trim();
        return stringValue || defaultValue;
      };

      const safeComprimento = (value: any): string => {
        if (value === null || value === undefined) {
          return '0';
        }
        // Handle numeric values
        if (typeof value === 'number') {
          return String(value);
        }
        // Handle string values
        if (typeof value === 'string') {
          const cleaned = value.trim();
          if (cleaned === '' || cleaned === 'undefined' || cleaned === 'null') {
            return '0';
          }
          return cleaned;
        }
        return '0';
      };

      

      // Step 4: Build product data with comprehensive fallbacks
      const productData: Omit<Product, 'id'> = {
        familia: safeString(apiProduct.familia),
        modelo: safeString(apiProduct.modelo),
        acabamento: safeString(apiProduct.acabamento),
        cor: safeString(apiProduct.cor),
        comprimento: safeComprimento(apiProduct.comprimento),
        foto: apiProduct.foto || undefined,
        // API fields
        codigo: apiProduct.codigo || apiProduct.strCodigo || undefined,
        descricao: apiProduct.descricao || apiProduct.strDescricao || undefined,
        // EPW decoded fields for reference
        epwTipo: apiProduct.epwTipo || undefined,
        epwCertificacao: apiProduct.epwCertificacao || undefined,
        epwModelo: apiProduct.epwModelo || undefined,
        epwComprimento: apiProduct.epwComprimento || undefined,
        epwCor: apiProduct.epwCor || undefined,
        epwAcabamento: apiProduct.epwAcabamento || undefined,
        epwOriginalCode: apiProduct.epwOriginalCode || apiProduct.strCodigo || undefined,
      };

      console.log('📋 Step 4: Final product data to be saved:', productData);

      // Step 5: Comprehensive validation
      const validateField = (fieldName: string, value: any): boolean => {
        if (value === null || value === undefined || value === '') {
          console.log(`❌ Field ${fieldName} is invalid:`, value);
          return false;
        }
        if (typeof value === 'string' && value.trim() === '') {
          console.log(`❌ Field ${fieldName} is empty string:`, value);
          return false;
        }
        if (value === 'Indefinido' && fieldName !== 'familia') {
          console.log(`⚠️ Field ${fieldName} has default value, but allowed:`, value);
        }
        return true;
      };

      const requiredFields = [
        { name: 'familia', value: productData.familia },
        { name: 'modelo', value: productData.modelo },
        { name: 'acabamento', value: productData.acabamento },
        { name: 'cor', value: productData.cor },
        { name: 'comprimento', value: productData.comprimento }
      ];

      const invalidFields = requiredFields.filter(field => !validateField(field.name, field.value));
      
      if (invalidFields.length > 0) {
        const fieldDetails = invalidFields.map(f => `${f.name}: "${f.value}"`).join(', ');
        throw new Error(`Campos inválidos detectados: ${fieldDetails}`);
      }

      console.log('✅ Step 5: All validation checks passed');

      // Step 6: Try to add to database, fallback to local only if RLS error
      console.log('💾 Calling operations.addProduct...');
      try {
        await operations.addProduct(productData);
        console.log('✅ Step 6: Product added to database successfully');
      } catch (supabaseError) {
        console.error('🔴 === SUPABASE ERROR DETAILS ===');
        console.error('🔴 Error object:', supabaseError);
        console.error('🔴 Error message:', supabaseError?.message);
        console.error('🔴 Error code:', supabaseError?.code);
        console.error('🔴 Product data that failed:', JSON.stringify(productData, null, 2));
        
        // Enhanced RLS error detection
        const isRLSError = supabaseError?.message?.includes('row-level security policy') || 
                          supabaseError?.message?.includes('RLS') ||
                          supabaseError?.message?.includes('violates row-level security') ||
                          supabaseError?.code === '42501' ||
                          supabaseError?.code === 'PGRST301';
        
        const isPermissionError = supabaseError?.message?.includes('permission denied') ||
                                 supabaseError?.message?.includes('not allowed') ||
                                 supabaseError?.code === '42501';
        
        if (isRLSError || isPermissionError) {
          console.log('⚠️ RLS/Permission error detected - adding product locally only');
          
          // Add to local state only as fallback
          const localProduct: Product = {
            id: cleanId,
            ...productData,
          };
          
          setProducts(prev => {
            const exists = prev.some(p => p.id === cleanId);
            if (exists) {
              console.log('✅ Product already exists locally');
              return prev;
            }
            console.log('✅ Added product to local state only');
            return [...prev, localProduct];
          });
          
          console.log('✅ Step 6: Product added locally (database has RLS/permission restrictions)');
          
          // Show user-friendly message about local storage
          toast.success('Produto criado localmente (limitações da base de dados)', {
            description: 'O produto foi guardado no dispositivo, mas pode não estar sincronizado com a base de dados.'
          });
        } else {
          // Other database errors - try local fallback
          console.log('🔄 Non-RLS database error, attempting local fallback...');
          
          const localProduct: Product = {
            id: cleanId,
            ...productData,
          };
          
          setProducts(prev => {
            const exists = prev.some(p => p.id === cleanId);
            if (exists) {
              console.log('✅ Product already exists locally');
              return prev;
            }
            console.log('✅ Added product to local state as fallback');
            return [...prev, localProduct];
          });
          
          console.log('⚠️ Step 6: Product added locally due to database error');
          
          // Show warning about database connectivity
          toast.warning('Produto criado localmente', {
            description: 'Problemas de conectividade com a base de dados. O produto foi guardado localmente.'
          });
        }
      }
      
      // Return the product with the clean ID
      const resultProduct: Product = {
        id: cleanId,
        ...productData,
      };
      
      console.log('🎉 Successfully created product:', resultProduct);
      return resultProduct;
      
    } catch (error) {
      console.error('❌ Error in createProductFromApi:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // Provide more specific error messages
      let errorMessage = 'Erro desconhecido na conversão';
      if (error instanceof Error) {
        if (error.message.includes('Campos inválidos')) {
          errorMessage = error.message;
        } else if (error.message.includes('base de dados')) {
          errorMessage = error.message;
        } else if (error.message.includes('já existe')) {
          errorMessage = error.message;
        } else {
          errorMessage = `Erro na conversão: ${error.message}`;
        }
      }
      
      throw new Error(errorMessage);
    }
  };

  const handleClearAllMaterials = async () => {
    // Skip auth checks in development mode
    const success = await adminOps.clearAllMaterials();
    if (success) {
      // Refresh data to update the UI
      await refreshData();
    }
    return success;
  };

  const populateTestData = async () => {
    const { populateTestData: populate } = await import('@/utils/populateTestData');
    return populate({
      addMaterial: operations.addMaterial,
      addMovement: operations.addMovement,
      createProductFromApi,
      products,
    });
  };

  const contextValue: WarehouseContextType = {
    materials,
    products,
    movements,
    selectedShelf,
    loading,
    setSelectedShelf,
    clearAllData,
    clearDataPreservingMaterials,
    clearAllMaterials: handleClearAllMaterials,
    createProductFromApi,
    syncProducts,
    populateTestData,
    syncStatus,
    ...operations,
  };

  return (
    <WarehouseContext.Provider value={contextValue}>
      {children}
    </WarehouseContext.Provider>
  );
};

export const useWarehouse = () => {
  const context = useContext(WarehouseContext);
  if (context === undefined) {
    throw new Error('useWarehouse must be used within a WarehouseProvider');
  }
  return context;
};