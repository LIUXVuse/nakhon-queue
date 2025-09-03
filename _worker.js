// _worker.js —— 強化診斷版：自動偵測 KV 綁定 + 清楚錯誤訊息 + /api/health

function resolveKV(env) {
  // 正常情況：Name=QUEUE
  if (env.QUEUE && typeof env.QUEUE.get === "function") return env.QUEUE;

  // 你若不小心把 UUID 當 Name，也試著用 UUID 找
  const MAYBE_UUIDS = ["271878c58f2f4094a9a7f7a3066aa822"];
  for (const k of MAYBE_UUIDS) {
    if (env[k] && typeof env[k].get === "function") return env[k];
  }

  // 萬一還是找不到，嘗試找第一個像 KV 的物件
  for (const key of Object.keys(env)) {
    const v = env[key];
    if (v && typeof v.get === "function" && typeof v.put === "function") {
      return v;
    }
  }
  throw new Error("KV binding not found. 請到 Pages → Settings → Functions → Bindings 新增 KV 綁定（Name=QUEUE，Namespace 選你的 KV）。");
}

export default {
  async fetch(request, env, ctx) {
    try {
      if (!env.ASSETS) {
        return new Response("ASSETS binding missing (Pages Functions)", { status: 500 });
      }
      const KV = resolveKV(env);
      const url = new URL(request.url);

      // 診斷用：GET /api/health
      if (url.pathname === "/api/health") {
        const last = (await KV.get("lastNumber")) || "0";
        const current = (await KV.get("currentNumber")) || "0";
        return Response.json({ ok: true, last, current, hasAdminPassword: Boolean(env.ADMIN_PASSWORD) });
      }

      // 取號：POST /api/queue
      if (url.pathname === "/api/queue" && request.method === "POST") {
        const data = await request.json().catch(() => ({}));
        const last = parseInt((await KV.get("lastNumber")) || "0") || 0;
        const number = last + 1;

        await KV.put(
          `ticket:${number}`,
          JSON.stringify({
            name: data.name || "",
            gender: data.gender || "",
            phone: data.phone || "",
          }),
          { expirationTtl: 7200 }
        );
        await KV.put("lastNumber", String(number));

        return Response.json({ success: true, number });
      }

      // 目前號碼：GET /api/current
      if (url.pathname === "/api/current") {
        const current = await KV.get("currentNumber");
        if (!current) {
          const last = parseInt((await KV.get("lastNumber")) || "0") || 0;
          return Response.json({ current: null, last }); // 前端可顯示「已發到 last 號」
        }
        const info = await KV.get(`ticket:${current}`, { type: "json" });
        return Response.json({ current: { number: current, ...info } });
      }

      // 下一號：GET /api/next?password=xxx
      if (url.pathname === "/api/next") {
        const pw = url.searchParams.get("password");
        if (pw !== env.ADMIN_PASSWORD) {
          return Response.json({ success: false, message: "密碼錯誤" });
        }
        const last = parseInt((await KV.get("lastNumber")) || "0") || 0;
        const current = parseInt((await KV.get("currentNumber")) || "0") || 0;
        if (current >= last) {
          return Response.json({ success: false, message: "沒有下一號了" });
        }
        const next = current + 1;
        await KV.put("currentNumber", String(next));
        return Response.json({ success: true, number: next });
      }

      // 重置：GET /api/reset?password=xxx
      if (url.pathname === "/api/reset") {
        const pw = url.searchParams.get("password");
        if (pw !== env.ADMIN_PASSWORD) {
          return Response.json({ success: false, message: "密碼錯誤" });
        }
        await KV.put("lastNumber", "0");
        await KV.put("currentNumber", "0");
        return Response.json({ success: true });
      }

      return env.ASSETS.fetch(request);
    } catch (err) {
      // 直接把錯誤回給前端，方便你看到真正原因
      return Response.json({ error: String(err && err.message || err) }, { status: 500 });
    }
  },
};
