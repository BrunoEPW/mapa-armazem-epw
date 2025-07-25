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
  const [exclusions, setExclusions] = useState<ExclusionSettings>(loadExclusions);

  useEffect(() => {
    saveExclusions(exclusions);
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
    if (!exclusions.enabled || !codigo) return false;
    
    return exclusions.prefixes.some(prefix => 
      codigo.toUpperCase().startsWith(prefix.toUpperCase())
    );
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