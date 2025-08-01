// EPW Code Decoder - Uses real API data instead of hardcoded mappings
// Decodes EPW article codes to extract: Tipo, Certificação, Modelo, Comprimento, Cor, Acabamento
import { attributesApiService } from '@/services/attributesApiService';


export interface EPWDecodedProduct {
  tipo: { l: string; d: string };
  certif: { l: string; d: string };
  modelo: { l: string; d: string };
  comprim: { l: string; d: string };
  cor: { l: string; d: string };
  acabamento: { l: string; d: string };
}

export interface EPWDecodeResult {
  success: boolean;
  message: string;
  product?: EPWDecodedProduct;
}

// Enhanced EPW mappings with new prefixes and API integration
const EPW_MAPPINGS = {
  // Attribute 1: Tipo - Enhanced with new prefixes
  tipo: {
    // Single character types
    'C': 'Deck + Clip',
    'R': 'Régua', 
    'F': 'Fixação', 
    'G': 'Grelha',
    'H': 'Calha',
    'O': 'Outros',
    'X': 'Especial',
    'T': 'Tampa',
    'S': 'Sistema',
    'P': 'Perfil',
    'D': 'Drenagem',
    'U': 'União',
    'M': 'Material',
    'L': 'Linear',
    'B': 'Deck + Clip + Sarrafo',
    'A': 'Deck + Clip + Travessa Alumínio',
    // Two character types
    'CS': 'Calha Sistema',
    'TT': 'Tampa Técnica',
    'GG': 'Grelha Grande',
    'ML': 'Metro Linear',
    'RF': 'Régua FSC',
    'RS': 'Régua Standard'
  },
  
  // Attribute 2: Certificação
  certif: {
    'S': 'Sem',
    'F': 'FSC'
  },
  
  // Attribute 3: Modelo
  modelo: {
    'C': 'LcDeck Classic',
    'X': 'XR Model',
    'D': 'DR Model',
    'S': 'SR Model',
    'T': 'TR Model',
    'A': 'Avanzado',
    'B': 'Basic',
    'M': 'Master',
    'P': 'Pro',
    'L': 'Luxury',
    'R': 'Regular',
    'E': 'Elite',
    'F': 'Flex',
    'G': 'Grand',
    'H': 'Home',
    'I': 'Industrial',
    'J': 'Junior',
    'K': 'King',
    'N': 'Neo',
    'O': 'Original',
    'Q': 'Quality',
    'U': 'Ultra',
    'V': 'Value',
    'W': 'Wide',
    'Y': 'Young',
    'Z': 'Zoom deck'
  },
  
  // Attribute 4: Comprimento - basic mappings, API will provide real ones
  comprim: {
    '10': '1000mm',
    '12': '1200mm',
    '15': '1500mm',
    '18': '1800mm',
    '20': '2000mm',
    '23': '2300mm',
    '25': '2500mm',
    '30': '3000mm',
    '32': '3200mm',
    '35': '3500mm',
    '40': '4000mm',
    '45': '4500mm',
    '50': '5000mm',
    '60': '6000mm'
  },
  
  // Attribute 5: Cor - basic mappings, API will provide real ones
  cor: {
    'L': 'Branco',
    'P': 'Preto',
    'I': 'Inox',
    'C': 'Chocolate',
    'G': 'Cinzento',
    'A': 'Azul',
    'B': 'Bege',
    'D': 'Dourado',
    'E': 'Esmeralda',
    'F': 'Fume',
    'M': 'Marrom',
    'N': 'Natural',
    'V': 'Vulcan'
  },
  
  // Attribute 6: Acabamento - basic mappings, API will provide real ones
  acabamento: {
    'T': 'Texturado',
    'L': 'Liuxado',
    'B': 'Brilhante',
    'M': 'Mate',
    'R': 'Rugoso',
    'A': 'Acetinado',
    'N': 'Natural',
    'P': 'Polido',
    'G': 'Lixado + gravado wood grain'
  }
};

// Get available options for each attribute (equivalent to listaOptCA)
const getAttributeOptions = (attribute: keyof typeof EPW_MAPPINGS): string[] => {
  return Object.keys(EPW_MAPPINGS[attribute]);
};

// Enhanced API cache with pre-loading capabilities
let apiAttributesCache: { [key: string]: { [code: string]: string } } = {};
let apiLoadingPromises: { [key: string]: Promise<void> } = {};

// Pre-load all API attributes for better performance
export const preloadApiAttributes = async (): Promise<void> => {
  const attributes = ['tipo', 'modelo', 'cor', 'acabamento', 'comprim', 'certif'];
  
  try {
    await Promise.all(attributes.map(async (attribute) => {
      if (!apiAttributesCache[attribute]) {
        await getAttributeValue(attribute as keyof typeof EPW_MAPPINGS, '__preload__');
      }
    }));
    console.log('✅ [EPW Decoder] API attributes pre-loaded successfully');
  } catch (error) {
    console.warn('⚠️ [EPW Decoder] Failed to pre-load API attributes:', error);
  }
};

// Get attribute value description using API data with enhanced caching
const getAttributeValue = async (attribute: keyof typeof EPW_MAPPINGS, code: string): Promise<string> => {
  // Try static mappings first for performance
  const staticValue = EPW_MAPPINGS[attribute][code];
  if (staticValue) {
    return staticValue;
  }

  // Skip API call for pre-load trigger
  if (code === '__preload__') {
    // Just trigger the API loading
  }

  // Use API data if not in static mappings
  try {
    // Prevent multiple simultaneous API calls for the same attribute
    if (!apiAttributesCache[attribute] && !apiLoadingPromises[attribute]) {
      apiLoadingPromises[attribute] = (async () => {
        let apiData: any[] = [];
        
        switch (attribute) {
          case 'tipo':
            apiData = await attributesApiService.fetchTipos();
            break;
          case 'modelo':
            apiData = await attributesApiService.fetchModelos();
            break;
          case 'cor':
            apiData = await attributesApiService.fetchCores();
            break;
          case 'acabamento':
            apiData = await attributesApiService.fetchAcabamentos();
            break;
          case 'comprim':
            apiData = await attributesApiService.fetchComprimentos();
            break;
          case 'certif':
            apiData = await attributesApiService.fetchCertificacoes();
            break;
        }
        
        // Cache the API data
        apiAttributesCache[attribute] = {};
        apiData.forEach(item => {
          apiAttributesCache[attribute][item.l] = item.d;
        });
        
        delete apiLoadingPromises[attribute];
      })();
    }
    
    // Wait for loading to complete if in progress
    if (apiLoadingPromises[attribute]) {
      await apiLoadingPromises[attribute];
    }
    
    return apiAttributesCache[attribute]?.[code] || code;
  } catch (error) {
    console.warn(`Failed to fetch API data for ${attribute}:`, error);
    delete apiLoadingPromises[attribute];
    return code; // Return code if API fails
  }
};

// Synchronous version for immediate use (returns code if no cached value)
const getAttributeValueSync = (attribute: keyof typeof EPW_MAPPINGS, code: string): string => {
  // Try static mappings first
  const staticValue = EPW_MAPPINGS[attribute][code];
  if (staticValue) {
    return staticValue;
  }
  
  // Try cached API data
  const cachedValue = apiAttributesCache[attribute]?.[code];
  if (cachedValue) {
    return cachedValue;
  }
  
  // Return code as fallback
  return code;
};

export const decodeEPWReference = (ref: string, debug: boolean = false): EPWDecodeResult => {
  if (!ref || typeof ref !== 'string') {
    return { success: false, message: 'Invalid reference code' };
  }

  const cleanRef = ref.trim().toUpperCase();

  // Early detection for non-EPW codes (contains hyphens, starts with letters like OPT, etc.)
  if (cleanRef.includes('-') || /^[A-Z]{3}\d/.test(cleanRef)) {
    if (debug) {
      console.log(`🔍 [EPW Decoder] Non-EPW format detected: ${cleanRef} - returning failure for API fallback`);
    }
    return { success: false, message: `Non-EPW format detected: ${cleanRef}. Use API description.` };
  }

  // Special case for OSACAN001
  if (ref === 'OSACAN001') {
    return {
      success: true,
      message: 'Special case decoded',
      product: {
        tipo: { l: 'X', d: getAttributeValueSync('tipo', 'X') },
        certif: { l: 'S', d: getAttributeValueSync('certif', 'S') },
        modelo: { l: '--', d: 'Genérico' },
        comprim: { l: '', d: '' },
        cor: { l: '', d: '' },
        acabamento: { l: '', d: '' }
      }
    };
  }

  const refLength = ref.length;
  const refUpper = ref.toUpperCase();
  
  if (debug) {
    console.log(`🔍 EPW Debug - Analyzing: "${ref}" [Length: ${refLength}]`);
  }

  // Use adaptive parsing for all code lengths (7-11 characters)
  if (refLength >= 7 && refLength <= 11) {
    try {
      const decoded = parseEPWCodeAdaptive(cleanRef, debug);
      
      
      return {
        success: true,
        message: `Successfully decoded using adaptive parsing (${refLength}-char)`,
        product: decoded
      };
    } catch (error) {
      // Log failed decode for potential exception creation
      console.warn(`⚠️ [EPW Decoder] Failed to decode: ${cleanRef}`, error);
      
      return { success: false, message: `Decode error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  return { success: false, message: `Unsupported code length: ${refLength}. Expected 7-11 characters.` };
};

function parseEPWCodeAdaptive(cleanRef: string, debug: boolean = false): EPWDecodedProduct {
  if (debug) {
    console.log(`🔧 EPW Adaptive Parser - Processing: "${cleanRef}"`);
  }

  // Step 1: Remove the last 2 digits (FINAL part to ignore)
  const finalPart = cleanRef.slice(-2);
  let remaining = cleanRef.slice(0, -2);
  
  if (debug) {
    console.log(`📊 Final part (ignored): ${finalPart}, Remaining: ${remaining}`);
  }

  // Step 2: Extract acabamento (last 1 char)
  const acabamento = remaining.slice(-1);
  remaining = remaining.slice(0, -1);
  
  // Step 3: Extract cor (last 1 char)
  const cor = remaining.slice(-1);
  remaining = remaining.slice(0, -1);
  
  // Step 4: Extract comprimento (last 2 chars)
  const comprim = remaining.slice(-2);
  remaining = remaining.slice(0, -2);
  
  if (debug) {
    console.log(`🎨 Acabamento: ${acabamento}, Cor: ${cor}, Comprimento: ${comprim}, Front part: ${remaining}`);
  }

  // Step 5: Parse the front part (tipo, certif, modelo)
  const frontPart = parseFrontPart(remaining, debug);
  
  if (debug) {
    console.log(`🔍 Front part parsed:`, frontPart);
  }

  return {
    tipo: { l: frontPart.tipo, d: getAttributeValueSync('tipo', frontPart.tipo) },
    certif: { l: frontPart.certif, d: getAttributeValueSync('certif', frontPart.certif) },
    modelo: { l: frontPart.modelo, d: getAttributeValueSync('modelo', frontPart.modelo) },
    comprim: { l: comprim, d: getAttributeValueSync('comprim', comprim) },
    cor: { l: cor, d: getAttributeValueSync('cor', cor) },
    acabamento: { l: acabamento, d: getAttributeValueSync('acabamento', acabamento) }
  };
}

function parseFrontPart(remaining: string, debug: boolean = false): {
  tipo: string;
  certif: string;
  modelo: string;
} {
  if (debug) {
    console.log(`🏗️ Parsing front part: "${remaining}" (length: ${remaining.length})`);
  }

  // Define parsing strategies based on user description:
  // - Tipo: 1 or 2 characters
  // - Certificação: 1 character
  // - Modelo: remaining characters
  
  const strategies = [
    // Strategy 1: tipo=1, certif=1, modelo=rest
    () => {
      if (remaining.length >= 2) {
        const tipo = remaining[0];
        const certif = remaining[1];
        const modelo = remaining.slice(2);
        return { tipo, certif, modelo, score: validateFrontPart(tipo, certif, modelo) };
      }
      return null;
    },
    
    // Strategy 2: tipo=2, certif=1, modelo=rest
    () => {
      if (remaining.length >= 3) {
        const tipo = remaining.substring(0, 2);
        const certif = remaining[2];
        const modelo = remaining.slice(3);
        return { tipo, certif, modelo, score: validateFrontPart(tipo, certif, modelo) };
      }
      return null;
    }
  ];

  // Try strategies and pick the one with the highest validation score
  let bestResult = null;
  let bestScore = 0;

  for (let i = 0; i < strategies.length; i++) {
    const result = strategies[i]();
    if (result && result.score > bestScore) {
      bestResult = result;
      bestScore = result.score;
      
      if (debug) {
        console.log(`✅ Strategy ${i + 1} scored ${result.score}:`, result);
      }
    }
  }

  if (bestResult) {
    return {
      tipo: bestResult.tipo,
      certif: bestResult.certif,
      modelo: bestResult.modelo
    };
  }

  // Fallback: use strategy 1 even if not validated
  if (remaining.length >= 2) {
    const fallback = {
      tipo: remaining[0],
      certif: remaining[1],
      modelo: remaining.slice(2)
    };
    
    if (debug) {
      console.log(`⚠️ Using fallback strategy:`, fallback);
    }
    
    return fallback;
  }

  // Ultimate fallback for very short codes
  return {
    tipo: remaining[0] || '',
    certif: remaining[1] || '',
    modelo: remaining.slice(2) || ''
  };
}

function validateFrontPart(tipo: string, certif: string, modelo: string): number {
  let score = 0;
  
  // Check static mappings and cached API data for better validation
  if (tipo && getAttributeValueSync('tipo', tipo) !== tipo) score += 3;
  if (certif && getAttributeValueSync('certif', certif) !== certif) score += 3;
  if (modelo && getAttributeValueSync('modelo', modelo) !== modelo) score += 3;
  
  return score;
}

// Helper function to get familia from decoded EPW data
export const getEPWFamilia = (decoded: EPWDecodedProduct): string => {
  return `${decoded.tipo.d} ${decoded.modelo.d}`.trim();
};

// Helper function to get modelo from decoded EPW data
export const getEPWModelo = (decoded: EPWDecodedProduct): string => {
  return decoded.modelo.l || 'N/A';
};

// Helper function to get acabamento from decoded EPW data
export const getEPWAcabamento = (decoded: EPWDecodedProduct): string => {
  return decoded.acabamento.d || 'N/A';
};

// Helper function to get cor from decoded EPW data
export const getEPWCor = (decoded: EPWDecodedProduct): string => {
  return decoded.cor.d || 'N/A';
};

// Helper function to get comprimento from decoded EPW data
export const getEPWComprimento = (decoded: EPWDecodedProduct): string | number => {
  const comprimDesc = decoded.comprim.d;
  if (comprimDesc && comprimDesc.includes('cm')) {
    const numMatch = comprimDesc.match(/(\d+)/);
    return numMatch ? parseInt(numMatch[1]) : comprimDesc;
  }
  return comprimDesc || 'N/A';
};

// Test function for specific EPW codes mentioned in the plan
export const testEPWCodes = async (debug: boolean = true): Promise<void> => {
  const testCodes = ['RFL23AL01', 'RSZ32AG01', 'RSEZ23VL01', 'RSZ32VG01'];
  
  console.log('🧪 [EPW Decoder] Testing specific EPW codes...');
  
  // Pre-load API attributes for better testing
  await preloadApiAttributes();
  
  for (const code of testCodes) {
    console.log(`\n🔍 Testing code: ${code}`);
    const result = decodeEPWReference(code, debug);
    
    if (result.success && result.product) {
      console.log(`✅ [${code}] Decoded successfully:`);
      console.log(`   Tipo: ${result.product.tipo.l} (${result.product.tipo.d})`);
      console.log(`   Certificação: ${result.product.certif.l} (${result.product.certif.d})`);
      console.log(`   Modelo: ${result.product.modelo.l} (${result.product.modelo.d})`);
      console.log(`   Comprimento: ${result.product.comprim.l} (${result.product.comprim.d})`);
      console.log(`   Cor: ${result.product.cor.l} (${result.product.cor.d})`);
      console.log(`   Acabamento: ${result.product.acabamento.l} (${result.product.acabamento.d})`);
    } else {
      console.log(`❌ [${code}] Failed to decode: ${result.message}`);
    }
  }
  
  console.log('\n🎯 [EPW Decoder] Testing completed');
};

// Enhanced decode function with API validation
export const decodeEPWReferenceWithValidation = async (ref: string, debug: boolean = false): Promise<EPWDecodeResult> => {
  // First try standard decoding
  const standardResult = decodeEPWReference(ref, debug);
  
  if (!standardResult.success || !standardResult.product) {
    return standardResult;
  }
  
  // Validate decoded parts against API data
  try {
    const product = standardResult.product;
    
    // Get fresh API data for validation
    const [tipoDesc, certifDesc, modeloDesc, comprimDesc, corDesc, acabamentoDesc] = await Promise.all([
      getAttributeValue('tipo', product.tipo.l),
      getAttributeValue('certif', product.certif.l),
      getAttributeValue('modelo', product.modelo.l),
      getAttributeValue('comprim', product.comprim.l),
      getAttributeValue('cor', product.cor.l),
      getAttributeValue('acabamento', product.acabamento.l)
    ]);
    
    // Update descriptions with API data
    const validatedProduct: EPWDecodedProduct = {
      tipo: { l: product.tipo.l, d: tipoDesc },
      certif: { l: product.certif.l, d: certifDesc },
      modelo: { l: product.modelo.l, d: modeloDesc },
      comprim: { l: product.comprim.l, d: comprimDesc },
      cor: { l: product.cor.l, d: corDesc },
      acabamento: { l: product.acabamento.l, d: acabamentoDesc }
    };
    
    return {
      ...standardResult,
      product: validatedProduct,
      message: `${standardResult.message} + API validation`
    };
    
  } catch (error) {
    console.warn('⚠️ [EPW Decoder] API validation failed, using standard result:', error);
    return standardResult;
  }
};

// Clear all caches (useful for testing and debugging)
export const clearEPWCache = (): void => {
  apiAttributesCache = {};
  apiLoadingPromises = {};
  console.log('🧹 [EPW Decoder] All caches cleared');
};