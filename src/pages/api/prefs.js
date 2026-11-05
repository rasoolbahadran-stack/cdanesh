// /api/prefs — تنظیمات واقعی پنل برای همهٔ بازدیدکنندگان (سؤالات متداول، سئوی صفحات، ترتیب نمونه‌کار)
// GET  → خواندن عمومی (بدون نیاز به ورود) — سایت با این داده، ویرایش‌های مدیر را برای همه اعمال می‌کند
// PUT  → ذخیره (فقط مدیر) — کل تنظیمات: { faq: {…}, seo: {…}, portfolio: {…} } (بخش‌های ارسالی جایگزین می‌شوند)
export const prerender = false;

import { readDoc, writeDoc, DB_MS } from "../../../server/lib/store.mjs";
import { isAuthedAsync } from "../../../server/lib/admin-auth.mjs";

const DOC_KEY = "prefs.json";
const MAX_BYTES = 512 * 1024; // سقف منطقی برای تنظیمات

const json = (status, obj) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });

async function authed(request) {
  try {
    return await isAuthedAsync({
      headers: { cookie: request.headers.get("cookie") || "" },
    });
  } catch {
    return false;
  }
}

/* ساختار مجاز: فقط سه کلید شناخته‌شده؛ محتوای هر بخش باید object باشد */
function sanitize(input) {
  const out = {};
  for (const k of ["faq", "seo", "portfolio"]) {
    if (
      input &&
      typeof input === "object" &&
      !Array.isArray(input) &&
      input[k] !== undefined
    ) {
      if (
        typeof input[k] !== "object" ||
        input[k] === null ||
        Array.isArray(input[k])
      )
        return null;
      out[k] = input[k];
    }
  }
  return out;
}

export async function GET() {
  /* خواندن عمومی برای همه (واردشده یا نه) — سایتِ بازدیدکننده‌ها به این داده نیاز دارد؛
     محتوای آن عمومی است: سؤالات متداول، سئوی صفحات و ترتیب نمونه‌کار. */
  try {
    const data = await readDoc(DOC_KEY, { ms: DB_MS });
    return json(200, {
      ok: true,
      prefs:
        data && typeof data === "object" && !Array.isArray(data) ? data : {},
    });
  } catch {
    /* سند هنوز ساخته نشده → خالی؛ صفحه با داده‌های پیش‌فرض رندر می‌شود */
    return json(200, { ok: true, prefs: {} });
  }
}

export async function PUT({ request }) {
  if (!(await authed(request)))
    return json(401, { ok: false, error: "UNAUTH" });
  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, {
      ok: false,
      error: "BAD_JSON",
      message: "دادهٔ ارسالی معتبر نیست.",
    });
  }
  const incoming = sanitize(body);
  if (!incoming)
    return json(400, {
      ok: false,
      error: "BAD_SHAPE",
      message: "ساختار تنظیمات معتبر نیست.",
    });
  if (JSON.stringify(incoming).length > MAX_BYTES)
    return json(413, {
      ok: false,
      error: "TOO_LARGE",
      message: "حجم تنظیمات بیش از حد مجاز است.",
    });
  try {
    /* ادغام با سند موجود: فقط بخش‌های ارسالی جایگزین می‌شوند */
    let cur = {};
    try {
      const d = await readDoc(DOC_KEY, { ms: DB_MS });
      if (d && typeof d === "object" && !Array.isArray(d)) cur = d;
    } catch {
      /* سند موجود نیست → از صفر */
    }
    const next = Object.assign({}, cur, incoming);
    await writeDoc(DOC_KEY, next, { ms: DB_MS });
    return json(200, { ok: true, prefs: next });
  } catch (e) {
    return json(500, {
      ok: false,
      error: "STORE_ERROR",
      message: String((e && e.message) || e),
    });
  }
}
