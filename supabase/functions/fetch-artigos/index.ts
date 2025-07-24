import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { draw = 1, start = 0, length = 3000 } = await req.json().catch(() => ({}))
    
    console.log('🌐 [Edge Function] Making request to pituxa.epw.pt API')
    
    const apiUrl = new URL('https://pituxa.epw.pt/api/artigos')
    apiUrl.searchParams.set('draw', draw.toString())
    apiUrl.searchParams.set('start', start.toString())
    apiUrl.searchParams.set('length', length.toString())

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    console.log('✅ [Edge Function] Successfully fetched data:', data.data?.length || 0, 'items')

    return new Response(
      JSON.stringify(data),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      },
    )
  } catch (error) {
    console.error('❌ [Edge Function] Error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        data: [],
        draw: 1,
        recordsTotal: 0,
        recordsFiltered: 0
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      },
    )
  }
})