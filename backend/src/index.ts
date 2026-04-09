export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Record the Visitor (Security Logging)
    const ip = request.headers.get("cf-connecting-ip");
    const country = request.cf.country || "Unknown";
    
    // Silently save visit to database
    await env.DB.prepare(
      "INSERT INTO visitors (ip, country) VALUES (?, ?)"
    ).bind(ip, country).run();

    // 2. Handle Different Requests
    if (url.pathname === "/api/status") {
      return new Response(JSON.stringify({ status: "Secure Connection Active" }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response("Salon Nilmee API - Access Restricted", { status: 403 });
  }
};