// functions/api/auth.js
// GET /api/auth?password=...
export async function onRequestGet({ request, env }) {
    const url = new URL(request.url);
    const pw = url.searchParams.get("password") || "";
    const ok = pw === env.ADMIN_PASSWORD;
  
    return new Response(JSON.stringify({ success: ok }), {
      headers: { "content-type": "application/json" },
    });
  }
  