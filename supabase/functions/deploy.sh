#!/bin/bash
# Script para fazer deploy da Edge Function EPW API Proxy

echo "🚀 Fazendo deploy da Edge Function epw-api-proxy..."

# Fazer deploy da função
supabase functions deploy epw-api-proxy

echo "✅ Deploy concluído!"
echo ""
echo "📝 Para testar a função:"
echo "supabase functions serve"
echo ""
echo "📋 URL da função (após deploy):"
echo "https://[YOUR_PROJECT_REF].supabase.co/functions/v1/epw-api-proxy"