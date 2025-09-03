// worker.js
export default {
    async fetch(request, env, ctx) {
      const url = new URL(request.url);
  
      // API Routing
      if (url.pathname === "/api/queue" && request.method === "POST") {
        const data = await request.json();
        const queueLength = await env.QUEUE.length;
        const number = await env.QUEUE.get("lastNumber").then(n => parseInt(n) || 0) + 1;
  
        // Save info with TTL = 2 hours
        await env.QUEUE.put(`ticket:${number}`, JSON.stringify({
          name: data.name,
          gender: data.gender,
          phone: data.phone
        }), { expirationTtl: 7200 });
  
        await env.QUEUE.put("lastNumber", number.toString());
  
        return Response.json({ success: true, number });
      }
  
      if (url.pathname === "/api/current") {
        const current = await env.QUEUE.get("currentNumber");
        if (!current) return Response.json({ current: null });
  
        const info = await env.QUEUE.get(`ticket:${current}`, { type: "json" });
        return Response.json({ current: { number: current, ...info } });
      }
  
      if (url.pathname === "/api/next") {
        const pw = url.searchParams.get("password");
        if (pw !== "sawanpass") return Response.json({ success: false, message: "密碼錯誤" });
  
        const last = await env.QUEUE.get("lastNumber").then(n => parseInt(n) || 0);
        const current = await env.QUEUE.get("currentNumber").then(n => parseInt(n) || 0);
  
        if (current >= last) {
          return Response.json({ success: false, message: "沒有下一號了" });
        }
  
        const next = current + 1;
        await env.QUEUE.put("currentNumber", next.toString());
        return Response.json({ success: true, number: next });
      }
  
      if (url.pathname === "/api/reset") {
        const pw = url.searchParams.get("password");
        if (pw !== "sawanpass") return Response.json({ success: false, message: "密碼錯誤" });
  
        await env.QUEUE.put("lastNumber", "0");
        await env.QUEUE.put("currentNumber", "0");
        return Response.json({ success: true });
      }
  
      // 靜態資源 (index.html / admin.html / css)
      return env.ASSETS.fetch(request);
    },
  };
  