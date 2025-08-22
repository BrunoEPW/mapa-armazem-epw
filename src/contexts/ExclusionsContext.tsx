import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ExclusionSettings, loadExclusions, saveExclusions } from '@/lib/storage';

interface ExclusionsContextType {
  exclusions: ExclusionSettings;
  addPrefix: (prefix: string) => void;
  removePrefix: (prefix: string) => void;
  toggleEnabled: () => void;
  clearAllPrefixes: () => void;
  shouldExcludeProduct: (codigo: string) => boolean;
}

const ExclusionsContext = createContext<ExclusionsContextType | undefined>(undefined);

export const useExclusions = () => {
  const context = useContext(ExclusionsContext);
  if (!context) {
    throw new Error('useExclusions must be used within an ExclusionsProvider');
  }
  return context;
};

interface ExclusionsProviderProps {
  children: ReactNode;
}

export const ExclusionsProvider: React.FC<ExclusionsProviderProps> = ({ children }) => {
  // 🔒 CRITICAL: Load exclusions from localStorage - these settings must NEVER be reset
  // User-configured exclusions should persist across all app updates and data resets
  const [exclusions, setExclusions] = useState<ExclusionSettings>(() => {
    try {
      console.log('🔄 [ExclusionsProvider] Initializing exclusions...');
      const loaded = loadExclusions();
      console.log('🔄 [ExclusionsProvider] Loaded exclusions:', loaded);
      return loaded;
    } catch (error) {
      console.error('❌ [ExclusionsProvider] Failed to load exclusions:', error);
      // Return safe defaults if loading fails
      return {
        enabled: true,
        prefixes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  });

  // Force save exclusions immediately and on every change
  useEffect(() => {
    console.log('🔄 [ExclusionsProvider] Saving exclusions due to change:', exclusions);
    saveExclusions(exclusions);
  }, [exclusions]);

  // Additional safety: Force save before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('🔄 [ExclusionsProvider] Saving exclusions before page unload');
      saveExclusions(exclusions);
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [exclusions]);

  const addPrefix = (prefix: string) => {
    const cleanPrefix = prefix.trim().toUpperCase();
    if (cleanPrefix && !exclusions.prefixes.includes(cleanPrefix)) {
      setExclusions(prev => ({
        ...prev,
        prefixes: [...prev.prefixes, cleanPrefix],
      }));
    }
  };

  const removePrefix = (prefix: string) => {
    setExclusions(prev => ({
      ...prev,
      prefixes: prev.prefixes.filter(p => p !== prefix),
    }));
  };

  const toggleEnabled = () => {
    setExclusions(prev => ({
      ...prev,
      enabled: !prev.enabled,
    }));
  };

  const clearAllPrefixes = () => {
    setExclusions(prev => ({
      ...prev,
      prefixes: [],
    }));
  };

  const shouldExcludeProduct = (codigo: string): boolean => {
    try {
      // Ensure exclusions are always fresh from storage for critical decisions
      const currentExclusions = loadExclusions();
    
    if (!currentExclusions.enabled || !codigo) {
      return false;
    }
    
    const upperCodigo = codigo.toUpperCase();
    
    const shouldExclude = currentExclusions.prefixes.some(prefix => {
      const upperPrefix = prefix.toUpperCase();
      const matches = upperCodigo.startsWith(upperPrefix);
      if (matches) {
        console.log(`🚫 [ExclusionsContext] EXCLUDING: "${codigo}" matches prefix "${prefix}"`);
      }
      return matches;
    });
    
    // Special logging for "R" products to debug the issue
    if (upperCodigo.startsWith('R')) {
      console.log(`🔍 [R-DEBUG] Product: ${codigo}, Excluded: ${shouldExclude}, Active prefixes:`, currentExclusions.prefixes);
    }
    
    return shouldExclude;
    } catch (error) {
      console.error('❌ [ExclusionsContext] Error in shouldExcludeProduct:', error);
      return false; // Don't exclude on error
    }
  };

  return (
    <ExclusionsContext.Provider
      value={{
        exclusions,
        addPrefix,
        removePrefix,
        toggleEnabled,
        clearAllPrefixes,
        shouldExcludeProduct,
      }}
    >
      {children}
    </ExclusionsContext.Provider>
  );
};