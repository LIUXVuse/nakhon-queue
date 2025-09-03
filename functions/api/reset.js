export async function onRequestGet({ request, env }) {
    const url = new URL(request.url);
    const pw = url.searchParams.get("password");
    if (pw !== env.ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ success: false, message: "密碼錯誤" }), {
        headers: { "content-type": "application/json" },
      });
    }
    await env.QUEUE.put("lastNumber", "0");
    await env.QUEUE.put("currentNumber", "0");
    const v = parseInt((await env.QUEUE.get("resetVersion")) || "0") || 0;
    await env.QUEUE.put("resetVersion", String(v + 1)); // 版本遞增，通知前端清票
    return new Response(JSON.stringify({ success: true, version: v + 1 }), {
      headers: { "content-type": "application/json" },
    });
  }
  