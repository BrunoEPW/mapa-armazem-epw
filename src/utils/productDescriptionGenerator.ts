import { decodeEPWReference, getEPWModelo, getEPWAcabamento, getEPWCor, getEPWComprimento } from './epwCodeDecoder';
import { MODELOS_POR_FAMILIA, CORES, ACABAMENTOS, COMPRIMENTOS } from '@/data/product-data';

export interface ProductDescriptionData {
  modelo?: string;
  acabamento?: string;
  cor?: string;
  comprimento?: string | number;
  codigo?: string;
  epwOriginalCode?: string;
  apiDescription?: string;
}

/**
 * Generates an intelligent product description using available data sources
 */
export const generateProductDescription = (data: ProductDescriptionData): string => {
  console.log('🔄 generateProductDescription called with:', data);
  
  // First priority: use API description if available
  if (data.apiDescription && !data.apiDescription.startsWith('Produto EPW')) {
    console.log('✅ Using API description:', data.apiDescription);
    return data.apiDescription;
  }
  
  // Second priority: try to decode EPW if we have a codigo
  if (data.codigo) {
    console.log('🔍 Attempting to decode EPW code:', data.codigo);
    const decoded = decodeEPWReference(data.codigo);
    console.log('🔍 EPW decode result:', decoded);
    
    if (decoded.success && decoded.product) {
      const modelo = getEPWModelo(decoded.product);
      const cor = getEPWCor(decoded.product);
      const acabamento = getEPWAcabamento(decoded.product);
      const comprimento = getEPWComprimento(decoded.product);
      
      console.log('🔍 EPW decoded parts:', { modelo, cor, acabamento, comprimento });
      
      // Create description from decoded EPW data
      const parts = [];
      if (modelo && modelo !== 'N/A') parts.push(modelo);
      if (cor && cor !== 'N/A') parts.push(cor);
      if (acabamento && acabamento !== 'N/A') parts.push(acabamento);
      if (comprimento && comprimento !== 'N/A') {
        const compStr = typeof comprimento === 'number' ? `${comprimento}mm` : comprimento;
        parts.push(compStr);
      }
      
      if (parts.length > 0) {
        const epwDescription = parts.join(' - ');
        console.log('✅ Generated EPW description:', epwDescription);
        return epwDescription;
      }
    }
  }
  
  // Fallback to provided data
  console.log('🔄 Using fallback with provided data');
  const parts = [];
  
  if (data.modelo) {
    parts.push(data.modelo);
  }
  
  if (data.cor) {
    parts.push(data.cor);
  }
  
  if (data.acabamento) {
    parts.push(data.acabamento);
  }
  
  if (data.comprimento) {
    const compStr = typeof data.comprimento === 'number' ? `${data.comprimento}mm` : data.comprimento;
    parts.push(compStr);
  }
  
  // If we have enough parts, create description
  if (parts.length >= 2) {
    const basicDescription = parts.join(' - ');
    console.log('✅ Generated basic description:', basicDescription);
    return basicDescription;
  }
  
  // Last resort: use codigo or a generic description
  if (data.codigo) {
    const codeDescription = `Produto ${data.codigo}`;
    console.log('⚠️ Using code description:', codeDescription);
    return codeDescription;
  }
  
  if (data.epwOriginalCode) {
    const epwCodeDescription = `Produto ${data.epwOriginalCode}`;
    console.log('⚠️ Using EPW code description:', epwCodeDescription);
    return epwCodeDescription;
  }
  
  console.log('❌ No description could be generated, using fallback');
  return 'Produto sem descrição';
};

/**
 * Enhances existing product description if it's generic
 */
export const enhanceProductDescription = (currentDescription: string, data: ProductDescriptionData): string => {
  // Check if current description is generic and needs enhancement
  const isGeneric = currentDescription.startsWith('Produto EPW') || 
                   currentDescription === 'Produto sem descrição' ||
                   currentDescription.startsWith('Produto ') && currentDescription.length < 20;
  
  if (isGeneric) {
    return generateProductDescription(data);
  }
  
  return currentDescription;
};

/**
 * Validates if a model exists in our internal catalog
 */
export const isKnownModel = (modelo: string): boolean => {
  return Object.values(MODELOS_POR_FAMILIA).flat().includes(modelo);
};

/**
 * Validates if a color exists in our internal catalog
 */
export const isKnownColor = (cor: string): boolean => {
  return CORES.includes(cor);
};

/**
 * Validates if an acabamento exists in our internal catalog
 */
export const isKnownAcabamento = (acabamento: string): boolean => {
  return ACABAMENTOS.includes(acabamento);
};

/**
 * Gets the family for a given model
 */
export const getModelFamily = (modelo: string): string | null => {
  for (const [family, models] of Object.entries(MODELOS_POR_FAMILIA)) {
    if (models.includes(modelo)) {
      return family;
    }
  }
  return null;
};