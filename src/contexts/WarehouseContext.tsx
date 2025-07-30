import React, { createContext, useContext, useState, useEffect } from 'react';
import { Material, Product, Movement, ShelfData, ShelfLocation } from '@/types/warehouse';

import { useSupabaseWarehouseData } from '@/hooks/useSupabaseWarehouseData';
import { useSupabaseWarehouseOperations } from '@/hooks/useSupabaseWarehouseOperations';
import { useRealTimeSync } from '@/hooks/useRealTimeSync';
import { useDataReset } from '@/hooks/useDataReset';
import { useSupabaseAdminOperations } from '@/hooks/useSupabaseAdminOperations';
import { useProductWebService } from '@/hooks/useProductWebService';

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
  clearAllMaterials: () => Promise<boolean>;
  createProductFromApi: (apiProduct: any) => Promise<Product>;
  syncProducts: () => Promise<boolean>;
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
  const { clearAllData } = useDataReset(setMaterials, setProducts, setMovements);
  
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
    console.log('🚀 === CREATE PRODUCT FROM API DEBUG ===');
    console.log('🔍 Input apiProduct:', JSON.stringify(apiProduct, null, 2));
    console.log('🔍 Type of apiProduct:', typeof apiProduct);
    console.log('🔍 apiProduct keys:', Object.keys(apiProduct || {}));
    
    // Enhanced validation with detailed error messages
    if (!apiProduct) {
      const error = 'apiProduct is null or undefined';
      console.error('❌', error);
      throw new Error(`Dados do produto inválidos: ${error}`);
    }

    // Validate required fields with detailed checks
    const requiredFields = ['familia', 'modelo', 'acabamento', 'cor', 'comprimento'];
    console.log('🔍 Checking required fields:', requiredFields);
    
    for (const field of requiredFields) {
      const value = apiProduct[field];
      console.log(`🔍 Field "${field}":`, value, `(type: ${typeof value})`);
      
      if (!value && value !== 0) { // Allow 0 as valid value
        const error = `Campo obrigatório em falta ou vazio: ${field}`;
        console.error('❌', error);
        throw new Error(error);
      }
    }
    console.log('✅ All required fields validation passed');
    
    // Enhanced ID generation with validation
    if (!apiProduct.id) {
      const error = 'Product ID is missing';
      console.error('❌', error);
      throw new Error(`ID do produto em falta: ${error}`);
    }
    
    const cleanId = apiProduct.id.startsWith('api_') ? apiProduct.id.replace('api_', '') : apiProduct.id;
    console.log('🆔 Clean ID generated:', cleanId);
    
    // Check if product already exists
    const existingProduct = products.find(p => p.id === cleanId);
    if (existingProduct) {
      console.log('ℹ️ Product already exists locally, returning existing:', existingProduct);
      return existingProduct;
    }
    
    // Create product data with enhanced type conversion and validation
    console.log('🔧 Converting and validating product data...');
    
    try {
      const newProduct: Omit<Product, 'id'> = {
        familia: String(apiProduct.familia || '').trim(),
        modelo: String(apiProduct.modelo || '').trim(),
        acabamento: String(apiProduct.acabamento || '').trim(),
        cor: String(apiProduct.cor || '').trim(),
        comprimento: String(apiProduct.comprimento || '').trim(),
        foto: apiProduct.foto || undefined,
        // Preserve API fields if they exist
        ...(apiProduct.codigo && { codigo: apiProduct.codigo }),
        ...(apiProduct.descricao && { descricao: apiProduct.descricao }),
        // Add EPW fields only if they exist
        ...(apiProduct.epwTipo && { epwTipo: apiProduct.epwTipo }),
        ...(apiProduct.epwCertificacao && { epwCertificacao: apiProduct.epwCertificacao }),
        ...(apiProduct.epwModelo && { epwModelo: apiProduct.epwModelo }),
        ...(apiProduct.epwComprimento && { epwComprimento: apiProduct.epwComprimento }),
        ...(apiProduct.epwCor && { epwCor: apiProduct.epwCor }),
        ...(apiProduct.epwAcabamento && { epwAcabamento: apiProduct.epwAcabamento }),
        ...(apiProduct.epwOriginalCode && { epwOriginalCode: apiProduct.epwOriginalCode }),
      };

      console.log('✅ Product formatted for Supabase:', JSON.stringify(newProduct, null, 2));

      // Double-check that all required fields are still valid after conversion
      const finalValidation = ['familia', 'modelo', 'acabamento', 'cor', 'comprimento'];
      for (const field of finalValidation) {
        if (!newProduct[field] || newProduct[field].trim() === '') {
          const error = `Campo ${field} está vazio após conversão`;
          console.error('❌', error);
          throw new Error(error);
        }
      }
      console.log('✅ Final validation passed');

      // Ready to add product to Supabase
      console.log('🔗 Ready to add product to Supabase...');

      // Add the product to Supabase with detailed error handling
      console.log('💾 Calling operations.addProduct...');
      try {
        await operations.addProduct(newProduct);
        console.log('✅ Product added to Supabase successfully');
      } catch (supabaseError) {
        console.error('🔴 === SUPABASE ERROR DETAILS ===');
        console.error('🔴 Error object:', supabaseError);
        console.error('🔴 Error message:', supabaseError?.message);
        console.error('🔴 Error name:', supabaseError?.name);
        console.error('🔴 Error stack:', supabaseError?.stack);
        console.error('🔴 Error cause:', supabaseError?.cause);
        console.error('🔴 Product data that failed:', JSON.stringify(newProduct, null, 2));
        throw new Error(`Erro ao guardar produto na base de dados: ${supabaseError?.message}`);
      }
      
      // Return the product with the clean ID
      const resultProduct: Product = {
        id: cleanId,
        ...newProduct,
      };
      
      console.log('🎉 Successfully created product:', JSON.stringify(resultProduct, null, 2));
      return resultProduct;
      
    } catch (conversionError) {
      console.error('❌ Error during product data conversion:', conversionError);
      console.error('❌ Conversion error details:', {
        message: conversionError?.message,
        stack: conversionError?.stack,
        originalData: apiProduct
      });
      throw new Error(`Erro na conversão dos dados do produto: ${conversionError?.message}`);
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

  const contextValue: WarehouseContextType = {
    materials,
    products,
    movements,
    selectedShelf,
    loading,
    setSelectedShelf,
    clearAllData,
    clearAllMaterials: handleClearAllMaterials,
    createProductFromApi,
    syncProducts,
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