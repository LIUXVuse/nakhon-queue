export async function onRequestGet({ env }) {
    const last = (await env.QUEUE.get("lastNumber")) || "0";
    const current = (await env.QUEUE.get("currentNumber")) || "0";
    return new Response(JSON.stringify({
      ok: true,
      last,
      current,
      hasAdminPassword: Boolean(env.ADMIN_PASSWORD),
    }), { headers: { "content-type": "application/json" } });
  }
  