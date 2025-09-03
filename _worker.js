// _worker.js —— Cloudflare Pages Functions（Advanced Mode）

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 取號：POST /api/queue
    if (url.pathname === "/api/queue" && request.method === "POST") {
      const data = await request.json().catch(() => ({}));
      const last = parseInt(await env.QUEUE.get("lastNumber")) || 0;
      const number = last + 1;

      await env.QUEUE.put(
        `ticket:${number}`,
        JSON.stringify({
          name: data.name || "",
          gender: data.gender || "",
          phone: data.phone || "",
        }),
        { expirationTtl: 7200 } // 2 小時
      );

      await env.QUEUE.put("lastNumber", String(number));
      return Response.json({ success: true, number });
    }

    // 目前號碼：GET /api/current
    if (url.pathname === "/api/current") {
      const current = await env.QUEUE.get("currentNumber");
      if (!current) return Response.json({ current: null });

      const info = await env.QUEUE.get(`ticket:${current}`, { type: "json" });
      return Response.json({ current: { number: current, ...info } });
    }

    // 下一號：GET /api/next?password=xxx
    if (url.pathname === "/api/next") {
      const pw = url.searchParams.get("password");
      if (pw !== env.ADMIN_PASSWORD) {
        return Response.json({ success: false, message: "密碼錯誤" });
      }

      const last = parseInt(await env.QUEUE.get("lastNumber")) || 0;
      const current = parseInt(await env.QUEUE.get("currentNumber")) || 0;

      if (current >= last) {
        return Response.json({ success: false, message: "沒有下一號了" });
      }

      const next = current + 1;
      await env.QUEUE.put("currentNumber", String(next));
      return Response.json({ success: true, number: next });
    }

    // 重置：GET /api/reset?password=xxx
    if (url.pathname === "/api/reset") {
      const pw = url.searchParams.get("password");
      if (pw !== env.ADMIN_PASSWORD) {
        return Response.json({ success: false, message: "密碼錯誤" });
      }

      await env.QUEUE.put("lastNumber", "0");
      await env.QUEUE.put("currentNumber", "0");
      return Response.json({ success: true });
    }

    // 其餘交給靜態資源（public/）
    return env.ASSETS.fetch(request);
  },
};
