export async function onRequestGet({ env }) {
    const current = await env.QUEUE.get("currentNumber");
    if (!current) {
      const last = parseInt((await env.QUEUE.get("lastNumber")) || "0") || 0;
      return new Response(JSON.stringify({ current: null, last }), {
        headers: { "content-type": "application/json" },
      });
    }
    const info = await env.QUEUE.get(`ticket:${current}`, { type: "json" });
    return new Response(JSON.stringify({ current: { number: current, ...info } }), {
      headers: { "content-type": "application/json" },
    });
  }
  