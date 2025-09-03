// functions/hello.js
export const onRequest = () =>
    new Response(JSON.stringify({ ok: true, msg: "hello from pages functions" }), {
      headers: { "content-type": "application/json" },
    });
  