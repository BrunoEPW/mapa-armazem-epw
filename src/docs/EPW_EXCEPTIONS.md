# 🔒 EPW Exceptions System - DOCUMENTAÇÃO CRÍTICA

## ⚠️ AVISO IMPORTANTE PARA DESENVOLVEDORES

Este sistema de exceções é **CRÍTICO** para o funcionamento da aplicação e deve ser tratado com **MÁXIMO CUIDADO**.

### 🛡️ PROTEÇÕES IMPLEMENTADAS

#### 1. **Armazenamento Permanente**
- ✅ Dados guardados em `localStorage` com chaves protegidas
- ✅ **NUNCA** deletar as chaves: `epw-code-exceptions`, `epw-exceptions-backup`
- ✅ Auto-backup criado automaticamente em cada operação
- ✅ Sistema de recuperação em caso de falha

#### 2. **Backup e Recuperação**
- 📥 **Export manual**: Utilizadores podem baixar backup JSON
- 📤 **Import manual**: Restaurar de arquivo JSON
- 🔄 **Auto-backup**: Backup automático a cada mudança
- 🆘 **Emergency backup**: Backup de emergência em caso de falha

#### 3. **Validação e Integridade**
- 🔍 Validação automática da estrutura dos dados
- ⚠️ Alertas em caso de corrupção
- 📊 Logs detalhados de todas as operações

### 📁 ARQUIVOS CRÍTICOS

#### `/src/lib/epwExceptions.ts`
```typescript
// ⚠️ ATENÇÃO: Arquivo de armazenamento permanente
// NÃO MODIFICAR CHAVES DE STORAGE
// NÃO REMOVER VALIDAÇÕES
// NÃO ALTERAR ESTRUTURA SEM MIGRAÇÃO
```

#### `/src/components/warehouse/EPWExceptionsManager.tsx`
- Interface de gestão das exceções
- Sistema de backup/restore
- Validação de integridade

### 🔐 CHAVES DE STORAGE (NÃO ALTERAR)

```typescript
const STORAGE_KEYS_EPW = {
  EPW_EXCEPTIONS: 'epw-code-exceptions',      // 🔒 DADOS PRINCIPAIS
  EPW_BACKUP: 'epw-exceptions-backup',        // 🔒 AUTO-BACKUP
  EPW_VERSION: 'epw-exceptions-version',      // 🔒 CONTROLE DE VERSÃO
} as const;
```

### 🚨 PROCEDIMENTOS OBRIGATÓRIOS

#### Antes de Atualizações de Código:
1. ✅ Verificar se localStorage está funcional
2. ✅ Confirmar presença de auto-backup
3. ✅ Testar export/import manual
4. ✅ Validar integridade dos dados

#### Durante Desenvolvimento:
1. 🚫 **NUNCA** limpar localStorage em produção
2. 🚫 **NUNCA** alterar chaves de storage
3. 🚫 **NUNCA** remover validações
4. ✅ **SEMPRE** testar backup/restore após mudanças

#### Após Deploy:
1. ✅ Verificar se exceções continuam carregadas
2. ✅ Testar funcionalidade de backup
3. ✅ Confirmar logs de integridade

### 📋 ESTRUTURA DE DADOS

```typescript
interface EPWException {
  code: string;                    // Código EPW
  reason: string;                  // Motivo da exceção
  manualMapping?: {                // Mapeamento manual (opcional)
    tipo?: string;
    certif?: string;
    modelo?: string;
    comprim?: string;
    cor?: string;
    acabamento?: string;
    useApiDescription?: boolean;   // Usar descrição da API
    apiDescricao?: string;         // Descrição preservada da API
  };
  createdAt: string;               // Data de criação
  updatedAt: string;               // Data de atualização
}

interface EPWExceptionsData {
  exceptions: EPWException[];       // Lista de exceções
  version: number;                 // Versão dos dados
  lastUpdated: string;             // Última atualização
  backupCount?: number;            // Contador de backups
  totalOperations?: number;        // Total de operações
}
```

### 🔧 COMANDOS DE EMERGÊNCIA

#### Recuperar de Backup Automático:
```typescript
import { restoreFromBackup } from '@/lib/epwExceptions';
const success = restoreFromBackup();
```

#### Validar Integridade:
```typescript
import { validateExceptionsIntegrity } from '@/lib/epwExceptions';
const validation = validateExceptionsIntegrity();
```

#### Export Manual:
```typescript
import { exportEPWExceptions } from '@/lib/epwExceptions';
const backupJson = exportEPWExceptions();
```

### 🚨 CHECKLIST DE EMERGÊNCIA

Em caso de perda de dados:

1. ✅ Verificar localStorage: `epw-code-exceptions`
2. ✅ Verificar auto-backup: `epw-exceptions-backup`
3. ✅ Verificar backup de emergência: `epw-code-exceptions-emergency`
4. ✅ Contactar utilizadores para backup manual
5. ✅ Utilizar função `restoreFromBackup()`
6. ✅ Re-importar dados via interface

### 📞 CONTACTOS DE EMERGÊNCIA

- **Sistema crítico**: EPW Exceptions afeta diretamente a decodificação de produtos
- **Impacto**: Perda de exceções pode causar falhas na identificação de produtos especiais
- **Prioridade**: MÁXIMA - Sistema de backup deve estar sempre funcional

---

## 🔒 NOTA FINAL

**Este sistema é fundamental para o funcionamento correto da aplicação. Qualquer modificação deve ser cuidadosamente planeada e testada. Em caso de dúvida, preservar sempre os dados existentes.**