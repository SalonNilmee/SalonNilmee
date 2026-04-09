export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    if (url.pathname === "/api/register" && request.method === "POST") {
      const { email } = await request.json();
      
      // Create a unique "Member Key" based on their email
      const memberKey = btoa(email).substring(0, 8).toUpperCase();

      // Save to Database so we know they are a real member
      await env.DB.prepare(
        "INSERT OR IGNORE INTO users (email, is_verified) VALUES (?, 1)"
      ).bind(email).run();

      return new Response(JSON.stringify({ 
        message: "Access Granted", 
        key: memberKey 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response("API Active", { headers: corsHeaders });
  }
};