export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const ip = request.headers.get("cf-connecting-ip") || "Unknown";

    // --- SECURE REGISTRATION LOGIC ---
    if (url.pathname === "/api/register" && request.method === "POST") {
      const { email } = await request.json();

      // 1. Save user as "Not Verified" in your D1 Database
      await env.DB.prepare(
        "INSERT OR IGNORE INTO users (email) VALUES (?)"
      ).bind(email).run();

      // 2. Send the Verification Email using your Secret Key
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Salon Nilmee <onboarding@resend.dev>",
          to: [email],
          subject: "Verify your Salon Nilmee Account",
          html: "<strong>Welcome!</strong> Click <a href='#'>here</a> to verify."
        }),
      });

      return new Response(JSON.stringify({ message: "Verification Email Sent!" }));
    }

    // --- RECORD VISITOR (SILENT) ---
    await env.DB.prepare("INSERT INTO visitors (ip) VALUES (?)").bind(ip).run();
    
    return new Response("Salon Nilmee API Active", { status: 200 });
  }
};