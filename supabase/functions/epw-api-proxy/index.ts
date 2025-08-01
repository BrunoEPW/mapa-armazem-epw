import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the target URL from query parameters
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get("url");
    
    if (!targetUrl) {
      return new Response(
        JSON.stringify({ error: "Missing 'url' parameter" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Validate that it's an EPW API URL for security
    if (!targetUrl.startsWith("https://pituxa.epw.pt/api/")) {
      return new Response(
        JSON.stringify({ error: "Only EPW API URLs are allowed" }),
        { 
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log(`[EPW Proxy] Proxying request to: ${targetUrl}`);

    // Forward the request to the EPW API
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "User-Agent": "EPW-Warehouse-System/1.0",
        "Accept": "application/json",
        // Don't forward authorization headers to external API
      },
      body: req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined,
    });

    // Get response body
    const responseBody = await response.text();
    
    console.log(`[EPW Proxy] Response status: ${response.status}`);
    console.log(`[EPW Proxy] Response body length: ${responseBody.length}`);

    // Forward the response with CORS headers
    return new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...corsHeaders,
        "Content-Type": response.headers.get("Content-Type") || "application/json",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
      },
    });

  } catch (error) {
    console.error("[EPW Proxy] Error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Proxy request failed", 
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});