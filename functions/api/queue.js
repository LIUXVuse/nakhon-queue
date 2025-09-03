export async function onRequestPost({ request, env }) {
    const data = await request.json().catch(() => ({}));
    const last = parseInt((await env.QUEUE.get("lastNumber")) || "0") || 0;
    const number = last + 1;
  
    await env.QUEUE.put(
      `ticket:${number}`,
      JSON.stringify({
        name: data.name || "",
        gender: data.gender || "",
        phone: data.phone || "",
      }),
      { expirationTtl: 7200 } // 2小時
    );
    await env.QUEUE.put("lastNumber", String(number));
  
    return Response.json({ success: true, number });
  }
  