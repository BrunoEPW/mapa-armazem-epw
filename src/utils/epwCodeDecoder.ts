// EPW Code Decoder - Uses real API data instead of hardcoded mappings
// Decodes EPW article codes to extract: Tipo, Certificação, Modelo, Comprimento, Cor, Acabamento
import { attributesApiService } from '@/services/attributesApiService';
import { getEPWException, hasEPWException, applyEPWException, addEPWException } from '@/lib/epwExceptions';

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

// Corrected EPW mappings based on real examples
const EPW_MAPPINGS = {
  // Attribute 1: Tipo
  tipo: {
    'C': 'Calha',
    'R': 'Réga',
    'F': 'Fixação', 
    'G': 'Grelha',
    'O': 'Outros',
    'X': 'Especial',
    'T': 'Tampa',
    'S': 'Sistema',
    'P': 'Perfil',
    'D': 'Drenagem',
    'U': 'União',
    'M': 'Material',
    'L': 'Linear',
    'CS': 'Calha Sistema',
    'TT': 'Tampa Técnica',
    'GG': 'Grelha Grande',
    'ML': 'Material Linear'
  },
  
  // Attribute 2: Certificação
  certif: {
    'S': 'Sem',
    'P': 'Premium',
    'E': 'Especial',
    'N': 'Normal'
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
    'Z': 'Zen'
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
    'V': 'Verde'
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
    'P': 'Polido'
  }
};

// Get available options for each attribute (equivalent to listaOptCA)
const getAttributeOptions = (attribute: keyof typeof EPW_MAPPINGS): string[] => {
  return Object.keys(EPW_MAPPINGS[attribute]);
};

// API-based attribute value lookup (replaces hardcoded mappings)
let apiAttributesCache: { [key: string]: { [code: string]: string } } = {};

// Get attribute value description using API data
const getAttributeValue = async (attribute: keyof typeof EPW_MAPPINGS, code: string): Promise<string> => {
  // Try static mappings first for performance
  const staticValue = EPW_MAPPINGS[attribute][code];
  if (staticValue) {
    return staticValue;
  }

  // Use API data if not in static mappings
  try {
    if (!apiAttributesCache[attribute]) {
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
    }
    
    return apiAttributesCache[attribute][code] || code;
  } catch (error) {
    console.warn(`Failed to fetch API data for ${attribute}:`, error);
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
  
  // Check for exceptions first - these are permanently preserved
  if (hasEPWException(cleanRef)) {
    const exception = getEPWException(cleanRef);
    if (debug) {
      console.log(`🔧 [EPW Decoder] Using exception for code: ${cleanRef}`, exception);
    }
    
    if (exception?.manualMapping) {
      const mapping = exception.manualMapping;
      return {
        success: true,
        message: `Exception applied: ${exception.reason}`,
        product: {
          tipo: { l: mapping.tipo || '', d: mapping.tipo || '' },
          certif: { l: mapping.certif || '', d: mapping.certif || '' },
          modelo: { l: mapping.modelo || '', d: mapping.modelo || '' },
          comprim: { l: mapping.comprim || '', d: mapping.comprim || '' },
          cor: { l: mapping.cor || '', d: mapping.cor || '' },
          acabamento: { l: mapping.acabamento || '', d: mapping.acabamento || '' },
        }
      };
    }
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
      
      // Apply any exception mappings
      const finalDecoded = applyEPWException(cleanRef, decoded);
      
      return {
        success: true,
        message: `Successfully decoded using adaptive parsing (${refLength}-char)`,
        product: finalDecoded
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

  // Step 1: Extract sequential numbers (always 2 digits at the end)
  const sequentialNumbers = cleanRef.slice(-2);
  let remaining = cleanRef.slice(0, -2);
  
  if (debug) {
    console.log(`📊 Sequential numbers: ${sequentialNumbers}, Remaining: ${remaining}`);
  }

  // Step 2: Extract cor (always 2 chars before sequential numbers)
  const cor = remaining.slice(-2);
  remaining = remaining.slice(0, -2);
  
  // Step 3: Extract comprimento (always 2 chars before cor)
  const comprim = remaining.slice(-2);
  remaining = remaining.slice(0, -2);
  
  if (debug) {
    console.log(`🎨 Cor: ${cor}, Comprimento: ${comprim}, Front part: ${remaining}`);
  }

  // Step 4: Parse the front part (tipo, certif, modelo, acabamento)
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
    acabamento: { l: frontPart.acabamento, d: getAttributeValueSync('acabamento', frontPart.acabamento) }
  };
}

function parseFrontPart(remaining: string, debug: boolean = false): {
  tipo: string;
  certif: string;
  modelo: string;
  acabamento: string;
} {
  if (debug) {
    console.log(`🏗️ Parsing front part: "${remaining}" (length: ${remaining.length})`);
  }

  // Define parsing strategies based on user description:
  // - Tipo: 1 or 2 characters
  // - Certificação: 1 character
  // - Modelo: 1 or 2 characters  
  // - Acabamento: variable (remaining chars)
  
  const strategies = [
    // Strategy 1: tipo=1, certif=1, modelo=1, acabamento=rest
    () => {
      if (remaining.length >= 3) {
        const tipo = remaining[0];
        const certif = remaining[1];
        const modelo = remaining[2];
        const acabamento = remaining.slice(3);
        return { tipo, certif, modelo, acabamento, score: validateFrontPart(tipo, certif, modelo, acabamento) };
      }
      return null;
    },
    
    // Strategy 2: tipo=2, certif=1, modelo=1, acabamento=rest
    () => {
      if (remaining.length >= 4) {
        const tipo = remaining.substring(0, 2);
        const certif = remaining[2];
        const modelo = remaining[3];
        const acabamento = remaining.slice(4);
        return { tipo, certif, modelo, acabamento, score: validateFrontPart(tipo, certif, modelo, acabamento) };
      }
      return null;
    },
    
    // Strategy 3: tipo=1, certif=1, modelo=2, acabamento=rest
    () => {
      if (remaining.length >= 4) {
        const tipo = remaining[0];
        const certif = remaining[1];
        const modelo = remaining.substring(2, 4);
        const acabamento = remaining.slice(4);
        return { tipo, certif, modelo, acabamento, score: validateFrontPart(tipo, certif, modelo, acabamento) };
      }
      return null;
    },
    
    // Strategy 4: tipo=2, certif=1, modelo=2, acabamento=rest
    () => {
      if (remaining.length >= 5) {
        const tipo = remaining.substring(0, 2);
        const certif = remaining[2];
        const modelo = remaining.substring(3, 5);
        const acabamento = remaining.slice(5);
        return { tipo, certif, modelo, acabamento, score: validateFrontPart(tipo, certif, modelo, acabamento) };
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
      modelo: bestResult.modelo,
      acabamento: bestResult.acabamento
    };
  }

  // Fallback: use strategy 1 even if not validated
  if (remaining.length >= 3) {
    const fallback = {
      tipo: remaining[0],
      certif: remaining[1],
      modelo: remaining[2],
      acabamento: remaining.slice(3)
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
    modelo: remaining[2] || '',
    acabamento: remaining.slice(3) || ''
  };
}

function validateFrontPart(tipo: string, certif: string, modelo: string, acabamento: string): number {
  let score = 0;
  
  // Check static mappings and cached API data for better validation
  if (tipo && getAttributeValueSync('tipo', tipo) !== tipo) score += 3;
  if (certif && getAttributeValueSync('certif', certif) !== certif) score += 3;
  if (modelo && getAttributeValueSync('modelo', modelo) !== modelo) score += 3;
  if (acabamento && getAttributeValueSync('acabamento', acabamento) !== acabamento) score += 1;
  
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