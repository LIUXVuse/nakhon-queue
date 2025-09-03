export async function onRequestGet({ env }) {
    const current = await env.QUEUE.get("currentNumber");
    if (!current) {
      const last = parseInt((await env.QUEUE.get("lastNumber")) || "0") || 0;
      return Response.json({ current: null, last });
    }
    const info = await env.QUEUE.get(`ticket:${current}`, { type: "json" });
    return Response.json({ current: { number: current, ...info } });
  }
  