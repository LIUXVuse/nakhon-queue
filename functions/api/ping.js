export async function onRequestGet({ env }) {
    return Response.json({
      ok: true,
      now: Date.now(),
      hasAdminPassword: Boolean(env.ADMIN_PASSWORD),
    });
  }
  