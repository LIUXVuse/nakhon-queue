// functions/api/lineup.js
// GET /api/lineup?limit=5
export async function onRequestGet({ request, env }) {
    const url = new URL(request.url);
    const limit = Math.max(1, Math.min(parseInt(url.searchParams.get("limit")) || 5, 20));
  
    const last = parseInt((await env.QUEUE.get("lastNumber")) || "0") || 0;
    const current = parseInt((await env.QUEUE.get("currentNumber")) || "0") || 0;
  
    const start = current + 1;
    const end = Math.min(last, current + limit);
  
    const promises = [];
    for (let n = start; n <= end; n++) {
      promises.push(env.QUEUE.get(`ticket:${n}`, { type: "json" }).then(info => ({ n, info })));
    }
    const rows = (await Promise.all(promises))
      .filter(x => x.info) // 可能因 TTL 過期而不存在
      .map(({ n, info }) => ({ number: n, name: info.name || "", gender: info.gender || "", phone: info.phone || "" }));
  
    return new Response(JSON.stringify({ totalWaiting: Math.max(0, last - current), next: rows }), {
      headers: { "content-type": "application/json" },
    });
  }
  