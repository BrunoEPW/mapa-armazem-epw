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

// Mapping tables equivalent to listaOptCA() and ArtigoAtribVal()
const EPW_MAPPINGS = {
  // Attribute 1: Tipo
  tipo: {
    'C': 'Calha',
    'R': 'Ralo',
    'F': 'Fixação', 
    'G': 'Grelha',
    'O': 'Outros',
    'X': 'Especial'
  },
  
  // Attribute 2: Certificação
  certif: {
    'S': 'Standard',
    'P': 'Premium',
    'E': 'Especial',
    'N': 'Normal'
  },
  
  // Attribute 3: Modelo - This would need to be populated from database
  modelo: {
    'XR': 'XR Model',
    'DR': 'DR Model',
    'SR': 'SR Model',
    'TR': 'TR Model',
    '--': 'Genérico'
  },
  
  // Attribute 4: Comprimento
  comprim: {
    '1C': '100cm',
    '2C': '200cm',
    '3C': '300cm',
    '4C': '400cm',
    '5C': '500cm',
    '6C': '600cm'
  },
  
  // Attribute 5: Cor
  cor: {
    'L': 'Branco',
    'P': 'Preto',
    'I': 'Inox',
    'C': 'Cobre',
    'G': 'Cinzento'
  },
  
  // Attribute 6: Acabamento
  acabamento: {
    'T': 'Texturado',
    'L': 'Liso',
    'B': 'Brilhante',
    'M': 'Mate',
    'R': 'Rugoso'
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
        modelo: { l: '--', d: getAttributeValue('modelo', '--') },
        comprim: { l: '', d: '' },
        cor: { l: '', d: '' },
        acabamento: { l: '', d: '' }
      }
    };
  }

  const tamRef = ref.length;
  const tipoOptions = getAttributeOptions('tipo');

  // Find initial letter length (tipo)
  let tamLetraInicial = 0;
  for (const letra of tipoOptions) {
    if (ref.startsWith(letra)) {
      tamLetraInicial = letra.length;
      break;
    }
  }

  if (tamLetraInicial === 0) {
    return { success: false, msg: 'Invalid tipo code' };
  }

  try {
    // Parse from right to left
    const refateCor = ref.slice(0, -2);
    const acabamento = refateCor.slice(-1);
    const cor = refateCor.slice(-2, -1);
    
    const refAteModelo = refateCor.slice(0, -2);
    const letraComprimento = refateCor.slice(-4, -2);
    
    const depoisComprimento = letraComprimento + cor + acabamento;
    const refAteCertif = ref.slice(0, tamLetraInicial + 1);
    const antesComprimento = refAteCertif;
    
    let letraModelo = ref.replace(antesComprimento, '').replace(depoisComprimento, '');
    
    // Adjust modelo if not in valid options
    const modeloOptions = getAttributeOptions('modelo');
    letraModelo = letraModelo.slice(0, -2);
    if (!modeloOptions.includes(letraModelo)) {
      letraModelo = letraModelo.slice(0, -1);
    }
    if (letraModelo === '') {
      letraModelo = antesComprimento;
    }
    
    const letraCertificacao = antesComprimento.slice(-1);
    const letraTipo = antesComprimento.slice(0, tamLetraInicial);

    if (debug) {
      console.log(`EPW Debug - Ref: ${ref} [Chars: ${tamRef}, Initial Letter Size: ${tamLetraInicial}]`);
      console.log(`Tipo: ${letraTipo}, Certif: ${letraCertificacao}, Modelo: ${letraModelo}, Comprim: ${letraComprimento}, Cor: ${cor}, Acabamento: ${acabamento}`);
    }

    return {
      success: true,
      msg: 'Successfully decoded',
      decoded: {
        tipo: { l: letraTipo, d: getAttributeValue('tipo', letraTipo) },
        certif: { l: letraCertificacao, d: getAttributeValue('certif', letraCertificacao) },
        modelo: { l: letraModelo, d: getAttributeValue('modelo', letraModelo) },
        comprim: { l: letraComprimento, d: getAttributeValue('comprim', letraComprimento) },
        cor: { l: cor, d: getAttributeValue('cor', cor) },
        acabamento: { l: acabamento, d: getAttributeValue('acabamento', acabamento) }
      }
    };
  } catch (error) {
    return { success: false, msg: `Decode error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
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