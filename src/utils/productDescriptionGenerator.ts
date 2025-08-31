import { decodeEPWReference, getEPWModelo, getEPWAcabamento, getEPWCor, getEPWComprimento } from './epwCodeDecoder';
import { MODELOS_POR_FAMILIA, CORES, ACABAMENTOS, COMPRIMENTOS } from '@/data/product-data';

export interface ProductDescriptionData {
  modelo?: string;
  acabamento?: string;
  cor?: string;
  comprimento?: string | number;
  codigo?: string;
  epwOriginalCode?: string;
}

/**
 * Generates an intelligent product description using available data sources
 */
export const generateProductDescription = (data: ProductDescriptionData): string => {
  // First try to use EPW decoded data if available
  if (data.epwOriginalCode) {
    const decoded = decodeEPWReference(data.epwOriginalCode);
    if (decoded.success && decoded.product) {
      const modelo = getEPWModelo(decoded.product);
      const cor = getEPWCor(decoded.product);
      const acabamento = getEPWAcabamento(decoded.product);
      const comprimento = getEPWComprimento(decoded.product);
      
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
        return parts.join(' - ');
      }
    }
  }
  
  // Fallback to provided data
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
    return parts.join(' - ');
  }
  
  // Last resort: use codigo or a generic description
  if (data.codigo) {
    return `Produto ${data.codigo}`;
  }
  
  if (data.epwOriginalCode) {
    return `Produto ${data.epwOriginalCode}`;
  }
  
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