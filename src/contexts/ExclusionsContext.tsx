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
    console.log('🔄 [ExclusionsProvider] Initializing exclusions...');
    const loaded = loadExclusions();
    console.log('🔄 [ExclusionsProvider] Loaded exclusions:', loaded);
    return loaded;
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
    // Ensure exclusions are always fresh from storage for critical decisions
    const currentExclusions = loadExclusions();
    
    if (!currentExclusions.enabled || !codigo) {
      return false;
    }
    
    const shouldExclude = currentExclusions.prefixes.some(prefix => {
      const matches = codigo.toUpperCase().startsWith(prefix.toUpperCase());
      return matches;
    });
    
    // Only log exclusions, not inclusions (too verbose)
    if (shouldExclude) {
      console.log(`🚫 [ExclusionsContext] Excluding product with code: ${codigo}, prefixes: ${currentExclusions.prefixes.join(', ')}`);
    }
    
    return shouldExclude;
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