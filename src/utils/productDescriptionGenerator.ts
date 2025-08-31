import { Product } from '@/types/warehouse';

interface ProductDescriptionData {
  codigo?: string;
  modelo?: string;
  acabamento?: string;
  cor?: string;
  comprimento?: string | number;
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
  
  // Second priority: use basic product data (no EPW decoding)
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
  
  if (data.comprimento && data.comprimento !== 0) {
    parts.push(`${data.comprimento}mm`);
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
  
  console.log('❌ No description could be generated, using fallback');
  return 'Produto sem descrição';
};

/**
 * Enhances generic product descriptions by calling generateProductDescription
 */
export const enhanceProductDescription = (currentDescription: string, data: ProductDescriptionData): string => {
  if (isGenericDescription(currentDescription)) {
    return generateProductDescription(data);
  }
  return currentDescription;
};

/**
 * Product data validation functions (simplified for API-only approach)
 */
export const isKnownModel = (modelo: string): boolean => {
  return Boolean(modelo && modelo.length > 2);
};

export const isKnownColor = (cor: string): boolean => {
  return Boolean(cor && cor.length > 1);
};

export const isKnownAcabamento = (acabamento: string): boolean => {
  return Boolean(acabamento && acabamento.length > 1);
};

export const getModelFamily = (modelo: string): string | null => {
  // Simplified family detection based on common patterns
  if (!modelo) return null;
  
  const lowerModelo = modelo.toLowerCase();
  if (lowerModelo.includes('deck')) return 'Decks';
  if (lowerModelo.includes('wall')) return 'Paredes';
  if (lowerModelo.includes('titanium')) return 'Titanium';
  
  return 'Outros';
};

/**
 * Checks if a product description is generic and needs enhancement
 */
export const isGenericDescription = (description: string): boolean => {
  return description.startsWith('Produto EPW') || 
         description === 'Produto sem descrição' ||
         description.startsWith('EPW ') ||
         (description.startsWith('Produto ') && description.length < 25);
};