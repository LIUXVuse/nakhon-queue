// _worker.js — Pages Advanced Functions (強化版)
// - 任何 /api/* 都會進到這裡（避免被靜態資源回 405）
// - 提供 /api/ping、/api/health 診斷
// - 對 POST/OPTIONS 友善（避免奇怪 405）
// - 明確回傳錯誤訊息，便於你貼給我看

function getKV(env) {
  // 正常綁定：Name=QUEUE
  if (env.QUEUE && typeof env.QUEUE.get === "function") return env.QUEUE;

  // 你曾用過 UUID 作為綁定名稱，做個備援
  const possible = ["271878c58f2f4094a9a7f7a3066aa822"];
  for (const k of possible) {
    if (env[k] && typeof env[k].get === "function") return env[k];
  }

  // 再保險找第一個像 KV 的物件
  for (const key of Object.keys(env)) {
    const v = env[key];
    if (v && typeof v.get === "function" && typeof v.put === "function") {
      return v;
    }
  }
  throw new Error("KV binding not found. 請到 Pages→Settings→Functions→Bindings 新增 KV：Name=QUEUE, Namespace=你的 KV。");
}

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });
}

function noContent(extra = {}) {
  return new Response(null, { status: 204, headers: extra });
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // 只要是 /api/* 我們就攔截（避免被靜態資源回 405）
      if (path.startsWith("/api/")) {
        // OPTIONS：有些情況瀏覽器會送（雖然同源通常不會）
        if (request.method === "OPTIONS") {
          return noContent(CORS_HEADERS);
        }

        const KV = getKV(env);

        // 健康檢查/診斷
        if (path === "/api/ping") {
          return json({ ok: true, now: Date.now(), hasAdminPassword: !!env.ADMIN_PASSWORD }, 200, CORS_HEADERS);
        }
        if (path === "/api/health") {
          const last = (await KV.get("lastNumber")) || "0";
          const current = (await KV.get("currentNumber")) || "0";
          return json({ ok: true, last, current, hasAdminPassword: !!env.ADMIN_PASSWORD }, 200, CORS_HEADERS);
        }

        // 取號
        if (path === "/api/queue") {
          if (request.method !== "POST") {
            return json({ error: "Method Not Allowed" }, 405, CORS_HEADERS);
          }
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
            { expirationTtl: 7200 } // 2 小時
          );
          await KV.put("lastNumber", String(number));

          return json({ success: true, number }, 200, CORS_HEADERS);
        }

        // 目前號碼
        if (path === "/api/current") {
          const current = await KV.get("currentNumber");
          if (!current) {
            const last = parseInt((await KV.get("lastNumber")) || "0") || 0;
            return json({ current: null, last }, 200, CORS_HEADERS);
          }
          const info = await KV.get(`ticket:${current}`, { type: "json" });
          return json({ current: { number: current, ...info } }, 200, CORS_HEADERS);
        }

        // 下一號
        if (path === "/api/next") {
          const pw = url.searchParams.get("password");
          if (pw !== env.ADMIN_PASSWORD) {
            return json({ success: false, message: "密碼錯誤" }, 200, CORS_HEADERS);
          }
          const last = parseInt((await KV.get("lastNumber")) || "0") || 0;
          const current = parseInt((await KV.get("currentNumber")) || "0") || 0;
          if (current >= last) {
            return json({ success: false, message: "沒有下一號了" }, 200, CORS_HEADERS);
          }
          const next = current + 1;
          await KV.put("currentNumber", String(next));
          return json({ success: true, number: next }, 200, CORS_HEADERS);
        }

        // 重置
        if (path === "/api/reset") {
          const pw = url.searchParams.get("password");
          if (pw !== env.ADMIN_PASSWORD) {
            return json({ success: false, message: "密碼錯誤" }, 200, CORS_HEADERS);
          }
          await KV.put("lastNumber", "0");
          await KV.put("currentNumber", "0");
          return json({ success: true }, 200, CORS_HEADERS);
        }

        // 未知 API
        return json({ error: "Not Found" }, 404, CORS_HEADERS);
      }

      // 其它路徑交給靜態資源
      if (!env.ASSETS) {
        return new Response("ASSETS binding missing (Pages Functions)", { status: 500 });
      }
      return env.ASSETS.fetch(request);
    } catch (err) {
      return json({ error: String(err && err.message || err) }, 500);
    }
  },
};
