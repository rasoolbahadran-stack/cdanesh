/* ═══ کافه‌دانش — پل سازگاری Node↔Web برای هندلرهای API ═══
   هندلرهای پنل (server/handlers/*.mjs) با امضای کلاسیک Vercel Function
   نوشته شده‌اند: handler(req, res). نقطه‌پایان‌های Astro (src/pages/api/*)
   درخواست/پاسخ استاندارد Web دارند؛ این پل، همان هندلرها را بدون هیچ
   تغییری در منطق، به endpointهای Astro وصل می‌کند. */

function toNodeReqRes(request, bodyText) {
  /* req با حداقلی که هندلرها استفاده می‌کنند:
     method ، headers (کوکی/xfwd) ، socket.remoteAddress ، on(data|end|error) ، destroy */
  const headers = {};
  request.headers.forEach((v, k) => { headers[k] = v; });

  const listeners = {};
  const add = ev => cb => { (listeners[ev] = listeners[ev] || []).push(cb); };
  const fire = ev => (...args) => { (listeners[ev] || []).forEach(cb => { try { cb(...args); } catch { /* noop */ } }); };

  const req = {
    method: request.method || 'GET',
    headers,
    socket: { remoteAddress: '' },
    on: (ev, cb) => add(ev)(cb),
    destroy() { /* noop */ },
  };

  const res = {
    statusCode: 200,
    headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    removeHeader(k) { delete this.headers[k]; },
    body: null,
    ended: false,
    end(body) { this.body = body == null ? '' : String(body); this.ended = true; },
  };

  /* بدنهٔ درخواست بلافاصله پس از اتصال شنونده‌ها (قرار انتظار readJsonBody) تحویل می‌شود */
  queueMicrotask(() => {
    try {
      if (bodyText) fire('data')(bodyText);
      fire('end')();
    } catch (e) {
      fire('error')(e);
    }
  });

  return { req, res };
}

function toResponse(res) {
  return new Response(res.body == null ? '' : res.body, {
    status: res.statusCode || 200,
    headers: res.headers || {},
  });
}

/* ساخت چهار متد HTTP از یک هندلر کلاسیک */
function endpoint(handler) {
  const run = async ({ request }) => {
    let bodyText = '';
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try { bodyText = await request.text(); } catch { bodyText = ''; }
    }
    const { req, res } = toNodeReqRes(request, bodyText);
    await handler(req, res);
    return toResponse(res);
  };
  return { GET: run, POST: run, PUT: run, DELETE: run };
}

export { endpoint as e };
