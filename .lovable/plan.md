

## Plano: Adicionar Botão "Limpar Todos os Materiais"

### 1. **Atualizar SettingsDialog.tsx**
- Adicionar um novo card na tab "Limpeza"
- Botão vermelho "Limpar Todos os Materiais"
- Mostrar estatísticas: número total de materiais, peças, prateleiras ocupadas
- Diálogo de confirmação antes de executar

### 2. **Funcionalidades do Botão**
- Mostrar aviso claro sobre a ação irreversível
- Opção para criar backup antes de limpar
- Chamar `clearAllMaterials()` do contexto
- Recarregar página após conclusão

### 3. **Pré-visualização**
- Mostrar quantos materiais serão removidos
- Mostrar quantas peças serão removidas
- Listar prateleiras afetadas

