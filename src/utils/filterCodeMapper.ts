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
    if (product.produto_codigo) {
      const decoded = decodeEPWReference(product.produto_codigo);
      if (decoded.success && decoded.decoded) {
        const { tipo, modelo, cor, acabamento, comprim } = decoded.decoded;
        
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

// Test function to validate filter codes work
export const testFilterCode = async (filterType: string, code: string): Promise<boolean> => {
  try {
    const testUrl = new URL('https://epw.ddns.net/epw/api/artigos');
    testUrl.searchParams.append('draw', '1');
    testUrl.searchParams.append('start', '0');
    testUrl.searchParams.append('length', '1');
    testUrl.searchParams.append(filterType, code);

    console.log(`🧪 [FilterCodeMapper] Testing ${filterType}=${code} at:`, testUrl.toString());

    const response = await fetch(testUrl.toString());
    const data = await response.json();
    
    const isValid = data.recordsFiltered !== undefined && data.recordsFiltered >= 0;
    console.log(`🧪 [FilterCodeMapper] Test result for ${filterType}=${code}:`, {
      isValid,
      recordsFiltered: data.recordsFiltered,
      recordsTotal: data.recordsTotal
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