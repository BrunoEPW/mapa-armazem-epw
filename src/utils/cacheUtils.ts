/**
 * Cache utilities for clearing browser storage
 * Protegido contra limpeza de dados de preservação de materiais
 */

import { PRESERVATION_KEYS } from './materialPreservation';

export const clearAllCache = (): void => {
  console.log('🧹 [CacheUtils] Clearing all localStorage cache...');
  
  try {
    const keys = Object.keys(localStorage);
    let clearedCount = 0;
    
    // Lista de chaves protegidas que nunca devem ser removidas
    const protectedKeys = [
      ...Object.values(PRESERVATION_KEYS),
      'user-exclusions',
      'user-exclusions-backup1',
      'user-exclusions-backup2',
      'user-exclusions-backup3'
    ];
    
    keys.forEach(key => {
      // Verificar se é uma chave de cache e não é protegida
      const isCacheKey = (
        key.startsWith('epw_api_cache') ||
        key.startsWith('epw_attributes_cache') ||
        key.includes('cache') && (
          key.includes('api') ||
          key.includes('attribute') ||
          key.includes('product')
        )
      );
      
      const isProtected = protectedKeys.includes(key);
      
      if (isCacheKey && !isProtected) {
        localStorage.removeItem(key);
        clearedCount++;
        console.log(`🗑️ [CacheUtils] Removed cache key: ${key}`);
      } else if (isCacheKey && isProtected) {
        console.log(`🔒 [CacheUtils] Protected key preserved: ${key}`);
      }
    });
    
    console.log(`✅ [CacheUtils] Cleared ${clearedCount} cache entries from localStorage`);
    console.log('🔒 [CacheUtils] Material preservation data protected');
  } catch (error) {
    console.warn('⚠️ [CacheUtils] Failed to clear localStorage cache:', error);
  }
};

export const clearSessionCache = (): void => {
  console.log('🧹 [CacheUtils] Clearing sessionStorage cache...');
  
  try {
    const keys = Object.keys(sessionStorage);
    let clearedCount = 0;
    
    keys.forEach(key => {
      if (
        key.includes('cache') && (
          key.includes('api') ||
          key.includes('attribute') ||
          key.includes('product')
        )
      ) {
        sessionStorage.removeItem(key);
        clearedCount++;
        console.log(`🗑️ [CacheUtils] Removed session cache key: ${key}`);
      }
    });
    
    console.log(`✅ [CacheUtils] Cleared ${clearedCount} session cache entries`);
  } catch (error) {
    console.warn('⚠️ [CacheUtils] Failed to clear sessionStorage cache:', error);
  }
};

export const clearAllAppCache = (): void => {
  console.log('🧹 [CacheUtils] Clearing all application cache...');
  clearAllCache();
  clearSessionCache();
  console.log('✅ [CacheUtils] All application cache cleared');
};