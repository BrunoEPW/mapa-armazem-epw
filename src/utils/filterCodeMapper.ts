// Filter Code Mapper - Maps between different code systems
// This utility helps bridge the gap between:
// 1. EPW decoder codes (local hardcoded mappings)
// 2. API attributes codes (from /api/atributos endpoints)
// 3. API filter codes (expected by /api/artigos filtering)

import { decodeEPWReference } from './epwCodeDecoder';

export interface CodeMapping {
  epwCode: string;
  apiCode: string;
  description: string;
}

// Helper function to extract unique codes from product references
export const extractCodesFromProducts = (products: any[]): {
  tipos: CodeMapping[];
  modelos: CodeMapping[];
  cores: CodeMapping[];
  acabamentos: CodeMapping[];
  comprimentos: CodeMapping[];
} => {
  const tipos = new Map<string, CodeMapping>();
  const modelos = new Map<string, CodeMapping>();
  const cores = new Map<string, CodeMapping>();
  const acabamentos = new Map<string, CodeMapping>();
  const comprimentos = new Map<string, CodeMapping>();

  products.forEach(product => {
    // Check for both produto_codigo and strCodigo properties
    const codigo = product.produto_codigo || product.strCodigo;
    if (codigo) {
      const decoded = decodeEPWReference(codigo);
      if (decoded.success && decoded.product) {
        const { tipo, modelo, cor, acabamento, comprim } = decoded.product;
        
        // Store mappings
        tipos.set(tipo.l, { epwCode: tipo.l, apiCode: tipo.l, description: tipo.d });
        modelos.set(modelo.l, { epwCode: modelo.l, apiCode: modelo.l, description: modelo.d });
        cores.set(cor.l, { epwCode: cor.l, apiCode: cor.l, description: cor.d });
        acabamentos.set(acabamento.l, { epwCode: acabamento.l, apiCode: acabamento.l, description: acabamento.d });
        comprimentos.set(comprim.l, { epwCode: comprim.l, apiCode: comprim.l, description: comprim.d });
      }
    }
  });

  return {
    tipos: Array.from(tipos.values()),
    modelos: Array.from(modelos.values()),
    cores: Array.from(cores.values()),
    acabamentos: Array.from(acabamentos.values()),
    comprimentos: Array.from(comprimentos.values())
  };
};

// Test function to validate filter codes work using our API service
export const testFilterCode = async (filterType: string, code: string): Promise<boolean> => {
  try {
    // Import the API service dynamically to avoid circular dependencies
    const { apiService } = await import('@/services/apiService');
    
    const filters: any = {};
    // Map filter type to API parameter name (capitalize first letter)
    const apiParamName = filterType.charAt(0).toUpperCase() + filterType.slice(1);
    filters[apiParamName] = code;
    
    console.log(`🧪 [FilterCodeMapper] Testing ${apiParamName}=${code}`);
    
    const result = await apiService.fetchArtigosWithTotal(1, 0, 1, filters);
    const isValid = result.recordsFiltered > 0;
    
    console.log(`🧪 [FilterCodeMapper] Test result for ${apiParamName}=${code}:`, {
      isValid,
      recordsFiltered: result.recordsFiltered,
      recordsTotal: result.recordsTotal
    });

    return isValid;
  } catch (error) {
    console.error(`🧪 [FilterCodeMapper] Test failed for ${filterType}=${code}:`, error);
    return false;
  }
};

// Function to find working filter codes
export const findWorkingFilterCodes = async (apiAttributes: any[], filterType: string): Promise<CodeMapping[]> => {
  const workingCodes: CodeMapping[] = [];
  
  console.log(`🔍 [FilterCodeMapper] Testing ${apiAttributes.length} codes for ${filterType}...`);
  
  for (const attr of apiAttributes) {
    const isWorking = await testFilterCode(filterType, attr.l);
    if (isWorking) {
      workingCodes.push({
        epwCode: attr.l,
        apiCode: attr.l,
        description: attr.d
      });
    }
    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`🔍 [FilterCodeMapper] Found ${workingCodes.length} working codes for ${filterType}:`, workingCodes);
  return workingCodes;
};