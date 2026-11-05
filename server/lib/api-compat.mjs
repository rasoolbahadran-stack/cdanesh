/* ═══ کافه‌دانش — پل سازگاری Node↔Web برای هندلرهای API ═══
   هندلرهای پنل (server/handlers/*.mjs) با امضای کلاسیک Vercel Function
   نوشته شده‌اند: handler(req, res). نقطه‌پایان‌های Astro (src/pages/api/*)
   درخواست/پاسخ استاندارد Web دارند؛ این پل، همان هندلرها را بدون هیچ
   تغییری در منطق، به endpointهای Astro وصل می‌کند. */

export function toNodeReqRes(request, bodyText) {
  /* req با حداقلی که هندلرها استفاده می‌کنند:
     method ، headers (کوکی/xfwd) ، socket.remoteAddress ، on(data|end|error) ، destroy */
  const headers = {};
  request.headers.forEach((v, k) => { headers[k] = v; });

  const listeners = {};
  const add = ev => cb => { (listeners[ev] = listeners[ev] || []).push(cb); };
  const fire = ev => (...args) => { (listeners[ev] || []).forEach(cb => { try { cb(...args); } catch { /* noop */ } }); };

  /* بدنهٔ درخواست: فقط وقتی هم شنوندهٔ data و هم end وصل شده باشند تحویل داده می‌شود.
     قبلاً با queueMicrotaskِ بی‌قید و شرط ارسال می‌شد؛ چون هندلرها اول await احراز هویت
     می‌کنند و بعد readJsonBody را وصل می‌کنند، رویدادها گم می‌شد و درخواست برای همیشه
     معلق می‌ماند — ریشهٔ واقعی «دکمهٔ انتشار هیچ عکس‌العملی نمی‌دهد». */
  const bodyStr = bodyText == null ? '' : String(bodyText);
  let delivered = false;
  const tryDeliver = () => {
    if (delivered || !listeners.data || !listeners.end) return;
    delivered = true;
    queueMicrotask(() => {
      try {
        if (bodyStr) fire('data')(bodyStr);
        fire('end')();
      } catch (e) {
        fire('error')(e);
      }
    });
  };

  const req = {
    method: request.method || 'GET',
    url: request.url || '/', // برای خواندن پارامترهای کوئری (?scope=public ، ?revisions= و ?key=)
    headers,
    socket: { remoteAddress: '' },
    on: (ev, cb) => { add(ev)(cb); if (ev === 'data' || ev === 'end') tryDeliver(); },
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

  return { req, res };
}

export function toResponse(res) {
  return new Response(res.body == null ? '' : res.body, {
    status: res.statusCode || 200,
    headers: res.headers || {},
  });
}

/* ساخت چهار متد HTTP از یک هندلر کلاسیک */
export function endpoint(handler) {
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
