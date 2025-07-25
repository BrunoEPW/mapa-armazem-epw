// EPW Code Decoder - Translates PHP algorithm to TypeScript
// Decodes EPW article codes to extract: Tipo, Certificação, Modelo, Comprimento, Cor, Acabamento

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
  msg: string;
  decoded?: EPWDecodedProduct;
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
    'X': 'Especial'
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
  
  // Attribute 4: Comprimento - numeric values in mm
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
  
  // Attribute 5: Cor
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
    'H': 'Honey',
    'J': 'Jade',
    'K': 'Khaki',
    'M': 'Marrom',
    'N': 'Natural',
    'O': 'Ocre',
    'Q': 'Quartzo',
    'R': 'Rosé',
    'S': 'Silver',
    'T': 'Titanium',
    'U': 'Único',
    'V': 'Verde',
    'W': 'White',
    'X': 'Xadrez',
    'Y': 'Yellow',
    'Z': 'Zinco'
  },
  
  // Attribute 6: Acabamento
  acabamento: {
    'T': 'Texturado',
    'L': 'Liuxado',
    'B': 'Brilhante',
    'M': 'Mate',
    'R': 'Rugoso',
    'A': 'Acetinado',
    'C': 'Cristal',
    'D': 'Diamante',
    'E': 'Espelhado',
    'F': 'Fosco',
    'G': 'Gloss',
    'H': 'Hammered',
    'J': 'Jateado',
    'K': 'Kraft',
    'N': 'Natural',
    'O': 'Oxidado',
    'P': 'Polido',
    'Q': 'Quartzo',
    'S': 'Satin',
    'U': 'Ultra',
    'V': 'Vintage',
    'W': 'Wood',
    'X': 'Xadrez',
    'Y': 'Yeso',
    'Z': 'Zen'
  }
};

// Get available options for each attribute (equivalent to listaOptCA)
const getAttributeOptions = (attribute: keyof typeof EPW_MAPPINGS): string[] => {
  return Object.keys(EPW_MAPPINGS[attribute]);
};

// Get attribute value description (equivalent to ArtigoAtribVal)
const getAttributeValue = (attribute: keyof typeof EPW_MAPPINGS, code: string): string => {
  return EPW_MAPPINGS[attribute][code] || code;
};

export const decodeEPWReference = (ref: string, debug: boolean = false): EPWDecodeResult => {
  if (!ref || typeof ref !== 'string') {
    return { success: false, msg: 'Invalid reference code' };
  }

  // Special case for OSACAN001
  if (ref === 'OSACAN001') {
    return {
      success: true,
      msg: 'Special case decoded',
      decoded: {
        tipo: { l: 'X', d: getAttributeValue('tipo', 'X') },
        certif: { l: 'S', d: getAttributeValue('certif', 'S') },
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

  // Handle 11-character codes (like csxr32clt01 -> CSXR32CLT01)
  if (refLength === 11) {
    try {
      // Analyzing pattern: csxr32clt01
      // Based on EPW structure analysis:
      // Position 0: Tipo (c)
      // Position 1: Certificação (s) 
      // Position 2: Unknown/Extra (x)
      // Position 3: Modelo (r)
      // Position 4-5: Comprimento (32)
      // Position 6: Cor (c)
      // Position 7: Acabamento (l)
      // Position 8: Unknown/Extra (t)
      // Position 9-10: Variant/Serie (01)
      
      const tipo = refUpper.charAt(0);
      const certif = refUpper.charAt(1);
      const modelo = refUpper.charAt(3);  // Skip position 2 for now
      const comprimento = refUpper.substring(4, 6);
      const cor = refUpper.charAt(6);
      const acabamento = refUpper.charAt(7);
      
      if (debug) {
        console.log(`🔍 EPW 11-char breakdown:`, {
          tipo, certif, modelo, comprimento, cor, acabamento,
          skipped: { pos2: refUpper.charAt(2), pos8: refUpper.charAt(8), variant: refUpper.substring(9, 11) }
        });
      }

      return {
        success: true,
        msg: 'Successfully decoded (11-char pattern)',
        decoded: {
          tipo: { l: tipo, d: getAttributeValue('tipo', tipo) },
          certif: { l: certif, d: getAttributeValue('certif', certif) },
          modelo: { l: modelo, d: getAttributeValue('modelo', modelo) },
          comprim: { l: comprimento, d: getAttributeValue('comprim', comprimento) },
          cor: { l: cor, d: getAttributeValue('cor', cor) },
          acabamento: { l: acabamento, d: getAttributeValue('acabamento', acabamento) }
        }
      };
    } catch (error) {
      return { success: false, msg: `Decode error (11-char): ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  // Handle 8-character codes (like RSC23CL01)
  if (refLength === 8) {
    try {
      const tipo = refUpper.charAt(0);
      const certif = refUpper.charAt(1);
      const modelo = refUpper.charAt(2);
      const comprimento = refUpper.substring(3, 5);
      const cor = refUpper.charAt(5);
      const acabamento = refUpper.charAt(6);
      
      if (debug) {
        console.log(`🔍 EPW 8-char breakdown:`, { tipo, certif, modelo, comprimento, cor, acabamento });
      }

      return {
        success: true,
        msg: 'Successfully decoded (8-char pattern)',
        decoded: {
          tipo: { l: tipo, d: getAttributeValue('tipo', tipo) },
          certif: { l: certif, d: getAttributeValue('certif', certif) },
          modelo: { l: modelo, d: getAttributeValue('modelo', modelo) },
          comprim: { l: comprimento, d: getAttributeValue('comprim', comprimento) },
          cor: { l: cor, d: getAttributeValue('cor', cor) },
          acabamento: { l: acabamento, d: getAttributeValue('acabamento', acabamento) }
        }
      };
    } catch (error) {
      return { success: false, msg: `Decode error (8-char): ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  // Handle 7-character codes (like RSC23CL)
  if (refLength === 7) {
    try {
      const tipo = refUpper.charAt(0);
      const certif = refUpper.charAt(1);
      const modelo = refUpper.charAt(2);
      const comprimento = refUpper.substring(3, 5);
      const cor = refUpper.charAt(5);
      const acabamento = refUpper.charAt(6);
      
      if (debug) {
        console.log(`🔍 EPW 7-char breakdown:`, { tipo, certif, modelo, comprimento, cor, acabamento });
      }

      return {
        success: true,
        msg: 'Successfully decoded (7-char pattern)',
        decoded: {
          tipo: { l: tipo, d: getAttributeValue('tipo', tipo) },
          certif: { l: certif, d: getAttributeValue('certif', certif) },
          modelo: { l: modelo, d: getAttributeValue('modelo', modelo) },
          comprim: { l: comprimento, d: getAttributeValue('comprim', comprimento) },
          cor: { l: cor, d: getAttributeValue('cor', cor) },
          acabamento: { l: acabamento, d: getAttributeValue('acabamento', acabamento) }
        }
      };
    } catch (error) {
      return { success: false, msg: `Decode error (7-char): ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  return { success: false, msg: `Unsupported code length: ${refLength}. Expected 7, 8, or 11 characters.` };
};

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