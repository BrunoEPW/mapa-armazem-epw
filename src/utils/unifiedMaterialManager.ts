/**
 * Sistema unificado de gestão de materiais
 * Substitui os múltiplos sistemas conflituantes por uma solução centralizada
 */

import { Material } from '@/types/warehouse';

// Chaves unificadas para armazenamento
export const UNIFIED_KEYS = {
  MATERIALS_PRIMARY: 'unified_materials_primary',
  MATERIALS_BACKUP: 'unified_materials_backup',
  MATERIALS_METADATA: 'unified_materials_metadata',
  PRESERVATION_ENABLED: 'unified_preservation_enabled',
  USER_SESSION: 'unified_user_session'
} as const;

interface MaterialMetadata {
  timestamp: number;
  count: number;
  userSession: string;
  source: 'user' | 'mock' | 'api';
  version: string;
}

interface UserSession {
  id: string;
  startTime: number;
  lastActivity: number;
}

/**
 * Gerar ID de sessão único para identificar dados do usuário
 */
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Obter ou criar sessão do usuário
 */
const getUserSession = (): UserSession => {
  try {
    const stored = localStorage.getItem(UNIFIED_KEYS.USER_SESSION);
    if (stored) {
      const session = JSON.parse(stored);
      // Sessão válida por 24 horas
      if (Date.now() - session.startTime < 24 * 60 * 60 * 1000) {
        session.lastActivity = Date.now();
        localStorage.setItem(UNIFIED_KEYS.USER_SESSION, JSON.stringify(session));
        return session;
      }
    }
  } catch (error) {
    console.warn('Erro ao recuperar sessão:', error);
  }

  // Criar nova sessão
  const newSession: UserSession = {
    id: generateSessionId(),
    startTime: Date.now(),
    lastActivity: Date.now()
  };
  
  localStorage.setItem(UNIFIED_KEYS.USER_SESSION, JSON.stringify(newSession));
  return newSession;
};

/**
 * Verificar se os materiais são dados reais do usuário (não mock)
 */
const areRealUserMaterials = (materials: Material[]): boolean => {
  if (materials.length === 0) return false;
  
  // Verificar se não são dados mock padrão
  const mockIndicators = [
    'Ferro de 12mm A500 NR',
    'Ferro de 16mm A500 NR',
    'Ferro de 20mm A500 NR'
  ];
  
  const hasMockData = materials.some(material => 
    mockIndicators.includes(material.product.modelo)
  );
  
  // Se tem dados mock e poucos materiais, provavelmente não é dado real
  if (hasMockData && materials.length <= 6) {
    return false;
  }
  
  return true;
};

/**
 * Verificar se a preservação está ativada
 */
export const isPreservationEnabled = (): boolean => {
  const enabled = localStorage.getItem(UNIFIED_KEYS.PRESERVATION_ENABLED);
  return enabled !== 'false'; // Por defeito ativo
};

/**
 * Ativar/desativar preservação
 */
export const setPreservationEnabled = (enabled: boolean): void => {
  localStorage.setItem(UNIFIED_KEYS.PRESERVATION_ENABLED, enabled.toString());
  console.log(`🔒 [UnifiedManager] Preservação ${enabled ? 'ativada' : 'desativada'}`);
};

/**
 * Guardar materiais de forma inteligente
 */
export const saveMaterials = (materials: Material[], source: 'user' | 'mock' | 'api' = 'user'): boolean => {
  if (!isPreservationEnabled()) {
    console.log('🔒 [UnifiedManager] Preservação desativada - não guardando');
    return false;
  }

  try {
    const session = getUserSession();
    const isRealData = areRealUserMaterials(materials);
    
    // Apenas guardar se forem dados reais do usuário
    if (source === 'user' && !isRealData) {
      console.log('🔍 [UnifiedManager] Dados detectados como mock - não guardando');
      return false;
    }

    const metadata: MaterialMetadata = {
      timestamp: Date.now(),
      count: materials.length,
      userSession: session.id,
      source,
      version: '2.0.0'
    };

    // Guardar dados principais
    localStorage.setItem(UNIFIED_KEYS.MATERIALS_PRIMARY, JSON.stringify(materials));
    localStorage.setItem(UNIFIED_KEYS.MATERIALS_METADATA, JSON.stringify(metadata));
    
    // Backup de segurança
    localStorage.setItem(UNIFIED_KEYS.MATERIALS_BACKUP, JSON.stringify({
      materials,
      metadata
    }));

    console.log(`💾 [UnifiedManager] ${materials.length} materiais guardados (${source})`);
    return true;
    
  } catch (error) {
    console.error('❌ [UnifiedManager] Erro ao guardar materiais:', error);
    return false;
  }
};

/**
 * Carregar materiais guardados
 */
export const loadMaterials = (): Material[] | null => {
  if (!isPreservationEnabled()) {
    return null;
  }

  try {
    // Tentar carregar dados principais
    const materialsData = localStorage.getItem(UNIFIED_KEYS.MATERIALS_PRIMARY);
    const metadataData = localStorage.getItem(UNIFIED_KEYS.MATERIALS_METADATA);
    
    if (materialsData && metadataData) {
      const materials = JSON.parse(materialsData);
      const metadata = JSON.parse(metadataData) as MaterialMetadata;
      
      // Verificar se os dados são recentes (últimas 48 horas)
      const age = Date.now() - metadata.timestamp;
      if (age > 48 * 60 * 60 * 1000) {
        console.log('⏰ [UnifiedManager] Dados muito antigos - ignorando');
        return null;
      }
      
      // Verificar se são dados do usuário
      if (metadata.source === 'user' && areRealUserMaterials(materials)) {
        console.log(`🔄 [UnifiedManager] Carregando ${materials.length} materiais do usuário`);
        return materials;
      }
    }

    // Tentar backup se dados principais falharam
    const backupData = localStorage.getItem(UNIFIED_KEYS.MATERIALS_BACKUP);
    if (backupData) {
      const backup = JSON.parse(backupData);
      if (backup.materials && areRealUserMaterials(backup.materials)) {
        console.log(`🔄 [UnifiedManager] Carregando ${backup.materials.length} materiais do backup`);
        return backup.materials;
      }
    }

    return null;
    
  } catch (error) {
    console.error('❌ [UnifiedManager] Erro ao carregar materiais:', error);
    return null;
  }
};

/**
 * Detectar se houve perda de materiais do usuário
 */
export const detectMaterialLoss = (currentMaterials: Material[]): boolean => {
  if (!isPreservationEnabled()) return false;

  try {
    const metadataData = localStorage.getItem(UNIFIED_KEYS.MATERIALS_METADATA);
    if (!metadataData) return false;

    const metadata = JSON.parse(metadataData) as MaterialMetadata;
    
    // Apenas detectar perda se os dados anteriores eram do usuário
    if (metadata.source !== 'user') return false;
    
    // Se tínhamos materiais do usuário e agora não temos
    const hadUserMaterials = metadata.count > 0;
    const hasUserMaterials = areRealUserMaterials(currentMaterials);
    
    if (hadUserMaterials && !hasUserMaterials) {
      console.log(`🚨 [UnifiedManager] Perda detectada: ${metadata.count} → ${currentMaterials.length} materiais`);
      return true;
    }

    return false;
    
  } catch (error) {
    console.warn('⚠️ [UnifiedManager] Erro na detecção de perda:', error);
    return false;
  }
};

/**
 * Limpar dados antigos e conflituantes
 */
export const cleanLegacyData = (): void => {
  console.log('🧹 [UnifiedManager] Limpando dados antigos conflituantes...');
  
  // Remover APENAS chaves antigas que não são usadas pelo sistema atual
  const legacyKeys = [
    'materials_backup_preservation',
    'materials_backup_metadata', 
    'materials_preservation_enabled',
    'materials_heartbeat',
    'materials_restore_attempts'
    // REMOVED: 'warehouse-materials-backup' - STILL IN USE BY CURRENT SYSTEM
    // REMOVED: 'warehouse-products-backup' - STILL IN USE BY CURRENT SYSTEM  
    // REMOVED: 'warehouse-movements-backup' - STILL IN USE BY CURRENT SYSTEM
    // REMOVED: 'warehouse-materials-preserve' - STILL IN USE BY CURRENT SYSTEM
    // REMOVED: 'warehouse-backup-metadata' - STILL IN USE BY CURRENT SYSTEM
  ];
  
  legacyKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      console.log(`🗑️ [UnifiedManager] Removida chave antiga: ${key}`);
    }
  });
  
  // Limpar sessionStorage também
  legacyKeys.forEach(key => {
    if (sessionStorage.getItem(key)) {
      sessionStorage.removeItem(key);
    }
  });
  
  console.log('✅ [UnifiedManager] Limpeza de dados antigos concluída');
};

/**
 * Obter estatísticas do sistema
 */
export const getSystemStats = () => {
  const metadata = localStorage.getItem(UNIFIED_KEYS.MATERIALS_METADATA);
  const session = getUserSession();
  
  return {
    preservationEnabled: isPreservationEnabled(),
    hasBackup: !!metadata,
    session: session.id,
    lastActivity: new Date(session.lastActivity).toLocaleString(),
    metadata: metadata ? JSON.parse(metadata) : null
  };
};

/**
 * Inicializar sistema unificado
 */
export const initializeUnifiedSystem = (): void => {
  // Limpar dados antigos conflituantes
  cleanLegacyData();
  
  // Ativar preservação por defeito
  if (localStorage.getItem(UNIFIED_KEYS.PRESERVATION_ENABLED) === null) {
    setPreservationEnabled(true);
  }
  
  // Inicializar sessão
  getUserSession();
  
  console.log('🔧 [UnifiedManager] Sistema unificado inicializado');
};