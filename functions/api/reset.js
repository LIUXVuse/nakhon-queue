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
    return new Response(JSON.stringify({ success: true }), {
      headers: { "content-type": "application/json" },
    });
  }
  