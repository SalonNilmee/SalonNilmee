export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Standard CORS headers to allow your frontend to talk to this backend
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle Preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // --- ROUTE 1: REGISTER/LOGIN ---
    // Saves email to the users table when they unlock the site
    if (url.pathname === "/api/register" && request.method === "POST") {
      try {
        const { email } = await request.json();
        
        await env.DB.prepare(
          "INSERT OR IGNORE INTO users (email, is_verified) VALUES (?, 1)"
        ).bind(email).run();

        return new Response(JSON.stringify({ success: true, message: "Access Granted" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { 
          status: 500, 
          headers: corsHeaders 
        });
      }
    }

    // --- ROUTE 2: GET DATA ---
    // Fetches both services and reviews for the frontend to display
    if (url.pathname === "/api/data" && request.method === "GET") {
      try {
        const services = await env.DB.prepare("SELECT * FROM services").all();
        // Newest reviews first
        const reviews = await env.DB.prepare("SELECT * FROM reviews ORDER BY id DESC").all();

        return new Response(JSON.stringify({
          services: services.results,
          reviews: reviews.results
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { 
          status: 500, 
          headers: corsHeaders 
        });
      }
    }

    // --- ROUTE 3: SUBMIT REVIEW ---
    // Takes the name, rating, comment, and the captured email
    if (url.pathname === "/api/reviews" && request.method === "POST") {
      try {
        const { name, rating, comment, email } = await request.json();
        const date = new Date().toLocaleDateString('en-GB'); // Format: DD/MM/YYYY

        await env.DB.prepare(
          "INSERT INTO reviews (name, rating, comment, date, email) VALUES (?, ?, ?, ?, ?)"
        ).bind(name, rating || 5, comment, date, email || "Anonymous").run();

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { 
          status: 500, 
          headers: corsHeaders 
        });
      }
    }

    // Default response if no route matches
    return new Response("Salon Nilmee API Active", { 
      status: 200, 
      headers: corsHeaders 
    });
  }
};