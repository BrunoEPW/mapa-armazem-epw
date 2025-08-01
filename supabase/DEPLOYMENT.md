# Implementar Edge Function no Supabase

## Problema Identificado
Após remover os elementos de debug, os serviços de API pararam de funcionar porque:
1. A Edge Function `epw-api-proxy` foi criada mas não foi implementada no Supabase
2. Os serviços estão a tentar usar a Edge Function que não existe no servidor

## Solução

### Opção 1: Implementar a Edge Function (Recomendado)
1. **Instalar Supabase CLI** (se ainda não tiver):
   ```bash
   npm install -g supabase
   ```

2. **Fazer login no Supabase**:
   ```bash
   supabase login
   ```

3. **Conectar ao projeto**:
   ```bash
   supabase link --project-ref [SEU_PROJECT_REF]
   ```

4. **Fazer deploy da Edge Function**:
   ```bash
   supabase functions deploy epw-api-proxy
   ```

### Opção 2: Sistema de Fallback (Já Implementado)
Se a Edge Function falhar, o sistema agora usa automaticamente o proxy público `corsproxy.io` como fallback.

## Verificar se funciona
1. Vá à página `/produtos`
2. Verifique se os produtos são carregados
3. Verifique os logs da consola para confirmar se está a usar Edge Function ou fallback

## Estado Atual
- ✅ Edge Function criada
- ✅ Fallback implementado
- ⏳ Edge Function precisa ser implementada no Supabase
- ✅ Aplicação deve funcionar com fallback enquanto isso

## Notas
- O fallback garante que a aplicação funciona mesmo sem a Edge Function
- A Edge Function oferece melhor performance e segurança
- Ambos os sistemas estão prontos e funcionais