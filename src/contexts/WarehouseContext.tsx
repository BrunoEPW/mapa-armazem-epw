import React, { createContext, useContext, useState, useEffect } from 'react';
import { Material, Product, Movement, ShelfData, ShelfLocation } from '@/types/warehouse';

import { useWarehouseData } from '@/hooks/useWarehouseData';
import { useSupabaseWarehouseData } from '@/hooks/useSupabaseWarehouseData';
import { useSupabaseWarehouseOperations } from '@/hooks/useSupabaseWarehouseOperations';
import { useRealTimeSync } from '@/hooks/useRealTimeSync';
import { useDataReset } from '@/hooks/useDataReset';
import { useSupabaseAdminOperations } from '@/hooks/useSupabaseAdminOperations';
import { useProductWebService } from '@/hooks/useProductWebService';
import * as epwCodeDecoder from '@/utils/epwCodeDecoder';
import { ensureValidProductId } from '@/utils/uuidUtils';
import { generateProductDescription } from '@/utils/productDescriptionGenerator';
import { toast } from 'sonner';

interface WarehouseContextType {
  materials: Material[];
  products: Product[];
  movements: Movement[];
  selectedShelf: ShelfLocation | null;
  loading: boolean;
  dataSource: 'mock' | 'supabase' | 'error';
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
  createProductFromApi: (apiProduct: any) => Promise<Product | null>;
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
  // Initialize state with localStorage data
  const [selectedShelf, setSelectedShelf] = useState<ShelfLocation | null>(null);
  
  // Use useWarehouseData as primary data source (loads from localStorage with recovery)
  const {
    materials,
    products,
    movements,
    setMaterials,
    setProducts,
    setMovements,
  } = useWarehouseData();
  
  // Keep Supabase as secondary data source for sync
  const warehouseData = useSupabaseWarehouseData();
  const { clearAllData, clearDataPreservingMaterials } = useDataReset(setMaterials, setProducts, setMovements);
  
  // Operations without auth checks for development
  const operations = useSupabaseWarehouseOperations({
    materials,
    products,
    movements,
    setMaterials,
    setProducts,
    setMovements,
    refreshData: warehouseData.refreshData,
  });
  
  const adminOps = useSupabaseAdminOperations();
  const { syncStatus, syncProducts } = useProductWebService();
  
  // Enable real-time synchronization
  useRealTimeSync(warehouseData.refreshData, warehouseData.refreshData, warehouseData.refreshData);

  const createProductFromApi = async (apiProductOrCode: any): Promise<Product | null> => {
    
    try {
      // Step 1: Handle both string codes and API product objects
      const isStringCode = typeof apiProductOrCode === 'string';
      console.log('🚀 createProductFromApi called with:', isStringCode ? `code: ${apiProductOrCode}` : 'API object');
      
      let apiProduct = apiProductOrCode;
      
      // If it's a string code, fetch the product from API
      if (isStringCode) {
        const productCode = apiProductOrCode;
        console.log(`🔍 Searching for product with code: ${productCode}`);
        
        try {
          // Use the new ApiService method to find the product
          const { apiService } = await import('@/services/apiService');
          const foundProduct = await apiService.findProductByCode(productCode);
          
          if (foundProduct) {
            console.log('✅ Found product in API:', foundProduct);
            apiProduct = foundProduct;
          } else {
            console.log(`❌ Product ${productCode} not found in API`);
            // Return null to let the caller handle fallback
            return null;
          }
        } catch (searchError) {
          console.error(`❌ Error searching for product ${productCode}:`, searchError);
          return null;
        }
      }

      // Step 2: Validate we have product data
      if (!apiProduct) {
        throw new Error('Dados do produto não fornecidos');
      }

      // Step 3: Extract the product code for ID generation and checks
      const codigo = apiProduct.strCodigo || apiProduct.codigo;
      if (!codigo) {
        throw new Error('ID ou código do produto em falta');
      }
      
      console.log('📋 Processing product with code:', codigo);
      
      // Check if product already exists by codigo (more reliable than ID)
      const existingProduct = products.find(p => p.codigo === codigo);
      if (existingProduct) {
        console.log('🔍 Product already exists locally:', existingProduct);
        return existingProduct;
      }

      // Step 4: Generate valid UUID from API product
      const apiId = apiProduct.Id || apiProduct.id || codigo || `temp-${Date.now()}`;
      const cleanId = ensureValidProductId(apiId);
      console.log('🆔 Generated valid UUID:', cleanId, 'from API ID:', apiId);

      // Step 5: Create safe field values with robust fallbacks
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

      // Step 6: Process EPW code if available for better field extraction
      let decodedEpw = null;
      try {
        console.log('🔍 Attempting to decode EPW code:', codigo);
        const epwResult = epwCodeDecoder.decodeEPWReference(codigo, true);
        if (epwResult.success && epwResult.product) {
          decodedEpw = epwResult.product;
          console.log('🎯 EPW decoded result:', decodedEpw);
        } else {
          console.log('⚠️ EPW code not recognized or failed to decode:', epwResult.message);
        }
      } catch (epwError) {
        console.warn('⚠️ EPW decoding failed (non-critical):', epwError);
      }

      // Step 7: Build product data with comprehensive fallbacks
      const productData: Omit<Product, 'id'> = {
        // Use API data or EPW decoded data as fallback
        
        modelo: safeString(apiProduct.modelo || decodedEpw?.modelo?.l, codigo.substring(0, 6)),
        acabamento: safeString(apiProduct.acabamento || decodedEpw?.acabamento?.l, codigo.substring(6, 8)),
        cor: safeString(apiProduct.cor || decodedEpw?.cor?.l, codigo.substring(8, 10)),
        comprimento: safeComprimento(apiProduct.comprimento || decodedEpw?.comprim?.l || 32),
        foto: apiProduct.foto || apiProduct.strFoto || undefined,
        // API fields
        codigo: codigo,
        descricao: generateProductDescription({
          codigo,
          modelo: apiProduct.modelo || decodedEpw?.modelo?.l,
          acabamento: apiProduct.acabamento || decodedEpw?.acabamento?.l,
          cor: apiProduct.cor || decodedEpw?.cor?.l,
          comprimento: apiProduct.comprimento || decodedEpw?.comprim?.l,
          apiDescription: apiProduct.descricao || apiProduct.strDescricao
        }),
        // EPW decoded fields for reference
        ...(decodedEpw && {
          epwTipo: decodedEpw.tipo?.d,
          epwCertificacao: decodedEpw.certif?.d,
          epwModelo: decodedEpw.modelo?.d,
          epwComprimento: decodedEpw.comprim?.d,
          epwCor: decodedEpw.cor?.d,
          epwAcabamento: decodedEpw.acabamento?.d,
          epwOriginalCode: codigo,
        }),
      };

      console.log('📋 Step 7: Final product data to be saved:', productData);

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
      await warehouseData.refreshData();
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
    loading: warehouseData.loading,
    dataSource: warehouseData.dataSource,
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