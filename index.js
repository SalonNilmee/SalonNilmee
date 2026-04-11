export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Standard CORS headers so your frontend can talk to your backend
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle Preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // --- 1. ROUTE: REGISTER / MAGIC LINK ---
      if (url.pathname === "/api/register" && request.method === "POST") {
        const { email } = await request.json();
        const token = btoa(email).substring(0, 15); 
        // This link points back to your site with the verify token
        const magicLink = `${url.origin}/?verify=${token}`;
        
        return new Response(JSON.stringify({ success: true, link: magicLink }), { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      // --- 2. ROUTE: FETCH DATA (Services & Reviews) ---
      if (url.pathname === "/api/data" && request.method === "GET") {
        // Fetching directly from your D1 "salon-db"
        const services = await env.DB.prepare("SELECT * FROM services").all();
        const reviews = await env.DB.prepare("SELECT * FROM reviews ORDER BY id DESC").all();
        
        return new Response(JSON.stringify({ 
          services: services.results, 
          reviews: reviews.results 
        }), { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      // --- 3. ROUTE: SUBMIT REVIEW ---
      if (url.pathname === "/api/reviews" && request.method === "POST") {
        const { name, rating, comment } = await request.json();
        const date = new Date().toLocaleDateString();
        
        await env.DB.prepare(
          "INSERT INTO reviews (name, rating, comment, date) VALUES (?, ?, ?, ?)"
        ).bind(name, rating, comment, date).run();

        return new Response(JSON.stringify({ success: true }), { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    return new Response("Not Found", { status: 404 });
  }
};