export async function onRequestGet({ request, env }) {
    const url = new URL(request.url);
    const pw = url.searchParams.get("password");
    if (pw !== env.ADMIN_PASSWORD) {
      return Response.json({ success: false, message: "密碼錯誤" });
    }
  
    const last = parseInt((await env.QUEUE.get("lastNumber")) || "0") || 0;
    const current = parseInt((await env.QUEUE.get("currentNumber")) || "0") || 0;
  
    if (current >= last) {
      return Response.json({ success: false, message: "沒有下一號了" });
    }
  
    const next = current + 1;
    await env.QUEUE.put("currentNumber", String(next));
    return Response.json({ success: true, number: next });
  }
  