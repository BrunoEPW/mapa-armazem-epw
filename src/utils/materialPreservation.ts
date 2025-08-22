/**
 * Sistema de preservação automática de materiais
 * Protege os materiais das prateleiras contra perda durante atualizações
 */

import { Material } from '@/types/warehouse';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/storage';

// Chaves específicas para preservação de materiais
export const PRESERVATION_KEYS = {
  MATERIALS_BACKUP: 'materials_backup_preservation',
  MATERIALS_BACKUP_METADATA: 'materials_backup_metadata',
  MATERIALS_PRESERVATION_ENABLED: 'materials_preservation_enabled',
  MATERIALS_HEARTBEAT: 'materials_heartbeat',
  MATERIALS_RESTORE_ATTEMPTS: 'materials_restore_attempts'
} as const;

interface MaterialBackupMetadata {
  timestamp: number;
  count: number;
  lastHeartbeat: number;
  version: string;
}

interface MaterialHeartbeat {
  timestamp: number;
  count: number;
  checksum: string;
}

/**
 * Ativar preservação de materiais por defeito
 */
export const enableMaterialPreservation = (): void => {
  localStorage.setItem(PRESERVATION_KEYS.MATERIALS_PRESERVATION_ENABLED, 'true');
  console.log('🔒 [MaterialPreservation] Preservação de materiais ativada');
};

/**
 * Verificar se a preservação de materiais está ativada
 */
export const isMaterialPreservationEnabled = (): boolean => {
  const enabled = localStorage.getItem(PRESERVATION_KEYS.MATERIALS_PRESERVATION_ENABLED);
  return enabled !== 'false'; // Por defeito é true, só false se explicitamente definido
};

/**
 * Criar checksum simples para detectar mudanças nos materiais
 */
const createMaterialChecksum = (materials: Material[]): string => {
  const summary = materials.reduce((acc, material) => {
    return acc + material.id + material.pecas + material.location.estante + material.location.prateleira;
  }, '');
  return btoa(summary).slice(0, 16); // Hash simples para detectar mudanças
};

/**
 * Criar backup automático dos materiais
 */
export const createMaterialBackup = (materials: Material[]): void => {
  if (!isMaterialPreservationEnabled()) return;
  
  try {
    const backup = {
      materials,
      metadata: {
        timestamp: Date.now(),
        count: materials.length,
        lastHeartbeat: Date.now(),
        version: '1.0.0'
      } as MaterialBackupMetadata
    };
    
    // Criar múltiplas camadas de backup
    localStorage.setItem(PRESERVATION_KEYS.MATERIALS_BACKUP, JSON.stringify(backup));
    sessionStorage.setItem(PRESERVATION_KEYS.MATERIALS_BACKUP, JSON.stringify(backup));
    
    // Atualizar heartbeat
    const heartbeat: MaterialHeartbeat = {
      timestamp: Date.now(),
      count: materials.length,
      checksum: createMaterialChecksum(materials)
    };
    localStorage.setItem(PRESERVATION_KEYS.MATERIALS_HEARTBEAT, JSON.stringify(heartbeat));
    
    console.log(`💾 [MaterialPreservation] Backup criado com ${materials.length} materiais`);
  } catch (error) {
    console.warn('⚠️ [MaterialPreservation] Erro ao criar backup:', error);
  }
};

/**
 * Restaurar materiais do backup mais recente
 */
export const restoreMaterialsFromBackup = (): Material[] | null => {
  if (!isMaterialPreservationEnabled()) {
    console.log('🔒 [MaterialPreservation] Preservação desativada - não restaurando');
    return null;
  }
  
  try {
    // Tentar localStorage primeiro
    let backupData = localStorage.getItem(PRESERVATION_KEYS.MATERIALS_BACKUP);
    
    // Se não encontrar, tentar sessionStorage
    if (!backupData) {
      backupData = sessionStorage.getItem(PRESERVATION_KEYS.MATERIALS_BACKUP);
      console.log('📦 [MaterialPreservation] Usando backup do sessionStorage');
    }
    
    if (!backupData) {
      console.log('❌ [MaterialPreservation] Nenhum backup encontrado');
      return null;
    }
    
    const backup = JSON.parse(backupData);
    const materials = backup.materials || backup; // Suporte para formatos antigos
    
    if (!Array.isArray(materials) || materials.length === 0) {
      console.log('❌ [MaterialPreservation] Backup inválido ou vazio');
      return null;
    }
    
    // Registrar tentativa de restauro
    const attempts = parseInt(localStorage.getItem(PRESERVATION_KEYS.MATERIALS_RESTORE_ATTEMPTS) || '0');
    localStorage.setItem(PRESERVATION_KEYS.MATERIALS_RESTORE_ATTEMPTS, String(attempts + 1));
    
    console.log(`🔄 [MaterialPreservation] Restaurando ${materials.length} materiais do backup`);
    return materials;
    
  } catch (error) {
    console.error('❌ [MaterialPreservation] Erro ao restaurar backup:', error);
    return null;
  }
};

/**
 * Detectar se os materiais foram perdidos inesperadamente
 */
export const detectMaterialLoss = (currentMaterials: Material[]): boolean => {
  if (!isMaterialPreservationEnabled()) return false;
  
  try {
    const heartbeatData = localStorage.getItem(PRESERVATION_KEYS.MATERIALS_HEARTBEAT);
    if (!heartbeatData) return false;
    
    const heartbeat: MaterialHeartbeat = JSON.parse(heartbeatData);
    const timeSinceHeartbeat = Date.now() - heartbeat.timestamp;
    
    // Se passou muito tempo desde o último heartbeat, pode ter havido perda
    if (timeSinceHeartbeat > 60000) { // 1 minuto
      console.log('⏰ [MaterialPreservation] Heartbeat expirado - possível perda detectada');
      return true;
    }
    
    // Se tínhamos materiais no heartbeat mas agora não temos
    if (heartbeat.count > 0 && currentMaterials.length === 0) {
      console.log(`🚨 [MaterialPreservation] Perda detectada: ${heartbeat.count} → 0 materiais`);
      return true;
    }
    
    // Se a redução for significativa (mais de 50%)
    if (heartbeat.count > 5 && currentMaterials.length < heartbeat.count * 0.5) {
      console.log(`🚨 [MaterialPreservation] Redução significativa: ${heartbeat.count} → ${currentMaterials.length} materiais`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.warn('⚠️ [MaterialPreservation] Erro na detecção de perda:', error);
    return false;
  }
};

/**
 * Atualizar heartbeat dos materiais
 */
export const updateMaterialHeartbeat = (materials: Material[]): void => {
  if (!isMaterialPreservationEnabled()) return;
  
  try {
    const heartbeat: MaterialHeartbeat = {
      timestamp: Date.now(),
      count: materials.length,
      checksum: createMaterialChecksum(materials)
    };
    localStorage.setItem(PRESERVATION_KEYS.MATERIALS_HEARTBEAT, JSON.stringify(heartbeat));
  } catch (error) {
    console.warn('⚠️ [MaterialPreservation] Erro ao atualizar heartbeat:', error);
  }
};

/**
 * Limpar dados de preservação (usar com cuidado)
 */
export const clearPreservationData = (): void => {
  Object.values(PRESERVATION_KEYS).forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  console.log('🧹 [MaterialPreservation] Dados de preservação limpos');
};

/**
 * Inicializar sistema de preservação
 */
export const initializeMaterialPreservation = (): void => {
  // Ativar preservação por defeito se não estiver definido
  if (localStorage.getItem(PRESERVATION_KEYS.MATERIALS_PRESERVATION_ENABLED) === null) {
    enableMaterialPreservation();
  }
  
  console.log('🔧 [MaterialPreservation] Sistema de preservação inicializado');
};