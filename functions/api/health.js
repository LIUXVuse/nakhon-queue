export async function onRequestGet({ env }) {
    const last = (await env.QUEUE.get("lastNumber")) || "0";
    const current = (await env.QUEUE.get("currentNumber")) || "0";
    return Response.json({
      ok: true,
      last,
      current,
      hasAdminPassword: Boolean(env.ADMIN_PASSWORD),
    });
  }
  