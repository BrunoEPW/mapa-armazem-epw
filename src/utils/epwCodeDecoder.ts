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
  
  // Handle 8-character codes (like RSC23CL01)
  if (refLength === 8) {
    try {
      const tipo = ref.charAt(0);           // Position 0: R
      const certif = ref.charAt(1);         // Position 1: S  
      const modelo = ref.charAt(2);         // Position 2: C
      const comprimento = ref.substring(3, 5); // Positions 3-4: 23
      const cor = ref.charAt(5);            // Position 5: C
      const acabamento = ref.charAt(6);     // Position 6: L
      
      if (debug) {
        console.log(`EPW Debug - Ref: ${ref} [Length: ${refLength}]`);
        console.log(`Tipo: ${tipo}, Certif: ${certif}, Modelo: ${modelo}, Comprim: ${comprimento}, Cor: ${cor}, Acabamento: ${acabamento}`);
      }

      return {
        success: true,
        msg: 'Successfully decoded',
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
      return { success: false, msg: `Decode error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  // Handle 7-character codes (like RSC23CL)
  if (refLength === 7) {
    try {
      const tipo = ref.charAt(0);           // Position 0
      const certif = ref.charAt(1);         // Position 1
      const modelo = ref.charAt(2);         // Position 2
      const comprimento = ref.substring(3, 5); // Positions 3-4
      const cor = ref.charAt(5);            // Position 5
      const acabamento = ref.charAt(6);     // Position 6
      
      if (debug) {
        console.log(`EPW Debug - Ref: ${ref} [Length: ${refLength}]`);
        console.log(`Tipo: ${tipo}, Certif: ${certif}, Modelo: ${modelo}, Comprim: ${comprimento}, Cor: ${cor}, Acabamento: ${acabamento}`);
      }

      return {
        success: true,
        msg: 'Successfully decoded',
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
      return { success: false, msg: `Decode error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  return { success: false, msg: `Unsupported code length: ${refLength}. Expected 7 or 8 characters.` };
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