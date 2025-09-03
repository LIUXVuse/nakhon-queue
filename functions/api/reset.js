export async function onRequestGet({ request, env }) {
    const url = new URL(request.url);
    const pw = url.searchParams.get("password");
    if (pw !== env.ADMIN_PASSWORD) {
      return Response.json({ success: false, message: "密碼錯誤" });
    }
    await env.QUEUE.put("lastNumber", "0");
    await env.QUEUE.put("currentNumber", "0");
    return Response.json({ success: true });
  }
  