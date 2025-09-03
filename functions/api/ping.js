export function onRequestGet({ env }) {
    return new Response(JSON.stringify({
      ok: true,
      now: Date.now(),
      hasAdminPassword: Boolean(env.ADMIN_PASSWORD),
    }), { headers: { "content-type": "application/json" } });
  }
  