// ⚠️  CRITICAL: EPW Code Exceptions - PERMANENT STORAGE ⚠️
// 🔒 This file preserves exception data and is NEVER deleted during code changes
// 🔒 EPW exceptions are stored in localStorage and survive all updates
// 🔒 DO NOT REMOVE OR MODIFY STORAGE KEYS - Data persistence depends on them
// 🔒 See EPW_EXCEPTIONS.md for complete documentation

export const STORAGE_KEYS_EPW = {
  EPW_EXCEPTIONS: 'epw-code-exceptions',
  EPW_MANUAL_MAPPINGS: 'epw-manual-mappings',
  EPW_BACKUP: 'epw-exceptions-backup',
  EPW_VERSION: 'epw-exceptions-version',
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
    // Add support for preserving API data
    useApiDescription?: boolean;
    apiDescricao?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface EPWExceptionsData {
  exceptions: EPWException[];
  version: number;
  lastUpdated: string;
  backupCount?: number;
  totalOperations?: number;
}

export interface EPWBackupData {
  data: EPWExceptionsData;
  backupDate: string;
  version: number;
  source: 'manual' | 'auto';
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
    
    // Auto-backup after every save
    if (key === STORAGE_KEYS_EPW.EPW_EXCEPTIONS) {
      createAutoBackup(data);
    }
  } catch (error) {
    console.error(`❌ [EPW Exceptions] CRITICAL: Failed to save ${key}:`, error);
    // Try to save to backup location
    try {
      localStorage.setItem(`${key}-emergency`, JSON.stringify(data));
      console.warn(`🆘 [EPW Exceptions] Saved to emergency backup for ${key}`);
    } catch (emergencyError) {
      console.error(`💀 [EPW Exceptions] FAILED TO SAVE EMERGENCY BACKUP:`, emergencyError);
    }
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

// 🔄 BACKUP AND EXPORT SYSTEM 🔄

const createAutoBackup = (data: EPWExceptionsData): void => {
  try {
    const backup: EPWBackupData = {
      data: { ...data, backupCount: (data.backupCount || 0) + 1 },
      backupDate: new Date().toISOString(),
      version: data.version,
      source: 'auto'
    };
    
    localStorage.setItem(STORAGE_KEYS_EPW.EPW_BACKUP, JSON.stringify(backup));
    console.log(`💾 [EPW Exceptions] Auto-backup created at ${backup.backupDate}`);
  } catch (error) {
    console.warn(`⚠️ [EPW Exceptions] Auto-backup failed:`, error);
  }
};

export const createManualBackup = (): EPWBackupData | null => {
  try {
    const currentData = loadEPWExceptions();
    const backup: EPWBackupData = {
      data: { ...currentData, totalOperations: (currentData.totalOperations || 0) + 1 },
      backupDate: new Date().toISOString(),
      version: currentData.version,
      source: 'manual'
    };
    
    console.log(`📥 [EPW Exceptions] Manual backup created with ${backup.data.exceptions.length} exceptions`);
    return backup;
  } catch (error) {
    console.error(`❌ [EPW Exceptions] Manual backup failed:`, error);
    return null;
  }
};

export const exportEPWExceptions = (): string => {
  const backup = createManualBackup();
  if (!backup) throw new Error('Failed to create backup');
  
  return JSON.stringify(backup, null, 2);
};

export const importEPWExceptions = (jsonData: string): boolean => {
  try {
    const importedData = JSON.parse(jsonData);
    
    // Validate structure
    if (!importedData.data || !Array.isArray(importedData.data.exceptions)) {
      throw new Error('Invalid backup format');
    }
    
    const currentData = loadEPWExceptions();
    const mergedExceptions = [...currentData.exceptions];
    
    // Merge imported exceptions (avoid duplicates)
    let importedCount = 0;
    importedData.data.exceptions.forEach((importedException: EPWException) => {
      const existingIndex = mergedExceptions.findIndex(ex => ex.code === importedException.code);
      if (existingIndex >= 0) {
        mergedExceptions[existingIndex] = importedException;
      } else {
        mergedExceptions.push(importedException);
        importedCount++;
      }
    });
    
    const newData: EPWExceptionsData = {
      ...currentData,
      exceptions: mergedExceptions,
      version: currentData.version + 1,
      lastUpdated: new Date().toISOString(),
      totalOperations: (currentData.totalOperations || 0) + 1
    };
    
    saveEPWExceptions(newData);
    console.log(`📤 [EPW Exceptions] Imported ${importedCount} new exceptions, ${mergedExceptions.length} total`);
    return true;
  } catch (error) {
    console.error(`❌ [EPW Exceptions] Import failed:`, error);
    return false;
  }
};

export const getBackupInfo = (): { hasBackup: boolean; backupDate?: string; exceptionsCount?: number } => {
  try {
    const backup = localStorage.getItem(STORAGE_KEYS_EPW.EPW_BACKUP);
    if (!backup) return { hasBackup: false };
    
    const backupData: EPWBackupData = JSON.parse(backup);
    return {
      hasBackup: true,
      backupDate: backupData.backupDate,
      exceptionsCount: backupData.data.exceptions.length
    };
  } catch {
    return { hasBackup: false };
  }
};

export const restoreFromBackup = (): boolean => {
  try {
    const backup = localStorage.getItem(STORAGE_KEYS_EPW.EPW_BACKUP);
    if (!backup) return false;
    
    const backupData: EPWBackupData = JSON.parse(backup);
    saveEPWExceptions(backupData.data);
    console.log(`🔄 [EPW Exceptions] Restored from backup: ${backupData.data.exceptions.length} exceptions`);
    return true;
  } catch (error) {
    console.error(`❌ [EPW Exceptions] Restore failed:`, error);
    return false;
  }
};

// 🔍 VALIDATION AND HEALTH CHECKS 🔍

export const validateExceptionsIntegrity = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  try {
    const data = loadEPWExceptions();
    
    if (!Array.isArray(data.exceptions)) {
      errors.push('Exceptions data is not an array');
    }
    
    if (!data.version || typeof data.version !== 'number') {
      errors.push('Invalid version number');
    }
    
    data.exceptions.forEach((exception, index) => {
      if (!exception.code || typeof exception.code !== 'string') {
        errors.push(`Exception ${index}: Invalid code`);
      }
      if (!exception.reason || typeof exception.reason !== 'string') {
        errors.push(`Exception ${index}: Invalid reason`);
      }
    });
    
    console.log(`🔍 [EPW Exceptions] Validation complete: ${errors.length} errors found`);
    return { isValid: errors.length === 0, errors };
  } catch (error) {
    errors.push(`Critical validation error: ${error}`);
    return { isValid: false, errors };
  }
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