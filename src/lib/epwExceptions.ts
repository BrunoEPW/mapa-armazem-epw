// EPW Code Exceptions - Permanent storage for problematic codes that need special handling
// This file preserves exception data and is NOT deleted during code changes

export const STORAGE_KEYS_EPW = {
  EPW_EXCEPTIONS: 'epw-code-exceptions',
  EPW_MANUAL_MAPPINGS: 'epw-manual-mappings',
} as const;

export interface EPWException {
  code: string;
  reason: string;
  manualMapping?: {
    tipo?: string;
    certif?: string; 
    modelo?: string;
    comprim?: string;
    cor?: string;
    acabamento?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface EPWExceptionsData {
  exceptions: EPWException[];
  version: number;
  lastUpdated: string;
}

const loadFromStorage = <T>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

const saveToStorage = (key: string, data: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`✅ [EPW Exceptions] Saved ${key} to localStorage`);
  } catch (error) {
    console.warn(`❌ [EPW Exceptions] Failed to save ${key}:`, error);
  }
};

export const loadEPWExceptions = (): EPWExceptionsData => {
  const data = loadFromStorage(STORAGE_KEYS_EPW.EPW_EXCEPTIONS, {
    exceptions: [
      // Default exceptions for known problematic codes
      {
        code: 'OSACAN001',
        reason: 'Special case - non-standard format',
        manualMapping: {
          tipo: 'X',
          certif: 'S', 
          modelo: '--',
          comprim: '',
          cor: '',
          acabamento: ''
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ],
    version: 1,
    lastUpdated: new Date().toISOString(),
  });
  
  console.log(`🔍 [EPW Exceptions] Loaded ${data.exceptions.length} exceptions from storage`);
  return data;
};

export const saveEPWExceptions = (data: EPWExceptionsData): void => {
  const dataToSave = {
    ...data,
    lastUpdated: new Date().toISOString(),
  };
  saveToStorage(STORAGE_KEYS_EPW.EPW_EXCEPTIONS, dataToSave);
};

export const addEPWException = (code: string, reason: string, manualMapping?: EPWException['manualMapping']): void => {
  const currentData = loadEPWExceptions();
  
  // Check if exception already exists
  const existingIndex = currentData.exceptions.findIndex(ex => ex.code === code);
  
  const exceptionData: EPWException = {
    code,
    reason,
    manualMapping,
    createdAt: existingIndex >= 0 ? currentData.exceptions[existingIndex].createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  if (existingIndex >= 0) {
    currentData.exceptions[existingIndex] = exceptionData;
    console.log(`🔄 [EPW Exceptions] Updated exception for code: ${code}`);
  } else {
    currentData.exceptions.push(exceptionData);
    console.log(`➕ [EPW Exceptions] Added new exception for code: ${code}`);
  }
  
  saveEPWExceptions(currentData);
};

export const removeEPWException = (code: string): void => {
  const currentData = loadEPWExceptions();
  const initialLength = currentData.exceptions.length;
  
  currentData.exceptions = currentData.exceptions.filter(ex => ex.code !== code);
  
  if (currentData.exceptions.length < initialLength) {
    console.log(`🗑️ [EPW Exceptions] Removed exception for code: ${code}`);
    saveEPWExceptions(currentData);
  } else {
    console.log(`⚠️ [EPW Exceptions] Exception not found for code: ${code}`);
  }
};

export const getEPWException = (code: string): EPWException | undefined => {
  const data = loadEPWExceptions();
  return data.exceptions.find(ex => ex.code === code);
};

export const hasEPWException = (code: string): boolean => {
  return getEPWException(code) !== undefined;
};

// Helper function to apply manual mappings to decoded product
export const applyEPWException = (code: string, defaultDecoded: any): any => {
  const exception = getEPWException(code);
  
  if (!exception || !exception.manualMapping) {
    return defaultDecoded;
  }
  
  const mapping = exception.manualMapping;
  
  return {
    tipo: { l: mapping.tipo || defaultDecoded.tipo?.l || '', d: mapping.tipo || defaultDecoded.tipo?.d || '' },
    certif: { l: mapping.certif || defaultDecoded.certif?.l || '', d: mapping.certif || defaultDecoded.certif?.d || '' },
    modelo: { l: mapping.modelo || defaultDecoded.modelo?.l || '', d: mapping.modelo || defaultDecoded.modelo?.d || '' },
    comprim: { l: mapping.comprim || defaultDecoded.comprim?.l || '', d: mapping.comprim || defaultDecoded.comprim?.d || '' },
    cor: { l: mapping.cor || defaultDecoded.cor?.l || '', d: mapping.cor || defaultDecoded.cor?.d || '' },
    acabamento: { l: mapping.acabamento || defaultDecoded.acabamento?.l || '', d: mapping.acabamento || defaultDecoded.acabamento?.d || '' },
  };
};