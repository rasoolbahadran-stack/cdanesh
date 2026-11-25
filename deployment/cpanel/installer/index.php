<?php
/**
 * کافه‌دانش — نصب‌کنندهٔ cPanel (رابط مرحله‌به‌مرحله)
 * ---------------------------------------------------------------------------
 * مرحلهٔ ۱: بررسی پیش‌نیازها (requirements.php)
 * مرحلهٔ ۲: دریافت اطلاعات دیتابیس/دامنه/مدیر اولیه و اجرا (install.php)
 * پس از نصب موفق، این مسیر با installed.lock و .htaccess قفل می‌شود.
 *
 * نکتهٔ امنیتی: این فایل فقط روی هاست اجرا می‌شود و هرگز رمزها را ذخیره یا
 * بازنشر نمی‌کند. پس از نصب، پوشهٔ installer را از حذف دستی باز نگیرید.
 */
declare(strict_types=1);
?>
<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>نصب پنل کافه‌دانش — cPanel</title>
<style>
  :root { --gold:#d4af37; --ink:#0b0b0e; --ink2:#15151a; --line:rgba(212,175,55,.25); --txt:#ecebe6; --dim:#9d9c95; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: Vazirmatn, Tahoma, sans-serif; background: linear-gradient(160deg,#0b0b0e,#15151a 60%,#0b0b0e); color: var(--txt); min-height:100vh; display:flex; align-items:center; justify-content:center; padding: clamp(14px,4vw,40px); }
  .card { width:100%; max-width: 640px; background: var(--ink2); border:1px solid var(--line); border-radius:18px; padding: clamp(20px,4vw,32px); box-shadow: 0 30px 80px rgba(0,0,0,.5); }
  h1 { margin:0 0 4px; font-size: clamp(17px,3vw,20px); color: var(--gold); }
  .sub { color: var(--dim); font-size: 12.5px; margin-bottom: 18px; }
  .steps { display:flex; gap:8px; margin-bottom: 18px; }
  .step { flex:1; height:4px; border-radius:4px; background: rgba(255,255,255,.08); }
  .step.on { background: var(--gold); }
  label { display:block; font-size:12.5px; color: var(--gold); margin:14px 0 6px; }
  input { width:100%; height:44px; background:rgba(0,0,0,.35); border:1px solid rgba(255,255,255,.09); border-radius:10px; color:var(--txt); padding:0 12px; font:inherit; font-size:14px; }
  input:focus { outline:none; border-color: var(--gold); box-shadow: 0 0 0 3px rgba(212,175,55,.15); }
  button { margin-top:18px; width:100%; height:48px; border:0; border-radius:12px; cursor:pointer; font:inherit; font-weight:800; color:#1a1406; background:linear-gradient(135deg,#f1dc9a,#d4af37 40%,#b8912a 75%,#d8b64a); }
  button:disabled { opacity:.6; cursor:wait; }
  #req-out { font-size:12.5px; line-height:2; max-height: 260px; overflow:auto; background:rgba(0,0,0,.3); border:1px solid rgba(255,255,255,.08); border-radius:12px; padding:12px; margin-top:12px; }
  .ok { color:#3ecf8e; } .bad { color:#ef6a6a; } .warn { color:#d4af37; }
  .msg { margin-top:14px; font-size:13px; line-height:2; border:1px solid; border-radius:10px; padding:10px 12px; display:none; }
  .msg.ok { color:#3ecf8e; border-color:rgba(62,207,142,.4); background:rgba(62,207,142,.08); }
  .msg.bad { color:#ef6a6a; border-color:rgba(239,106,106,.4); background:rgba(239,106,106,.08); }
  code { direction:ltr; unicode-bidi:embed; background:rgba(255,255,255,.06); padding:1px 6px; border-radius:6px; }
</style>
</head>
<body>
<div class="card">
  <h1>نصب پنل مدیریت کافه‌دانش</h1>
  <div class="sub">استقرار روی هاست cPanel — MySQL/MariaDB داخلی هاست، بدون هیچ سرویس خارجی</div>
  <div class="steps"><div class="step on" id="s1"></div><div class="step" id="s2"></div></div>

  <div id="phase1">
    <div class="sub">مرحلهٔ ۱ — بررسی پیش‌نیازهای هاست</div>
    <button type="button" id="btn-check">شروع بررسی</button>
    <div id="req-out"></div>
  </div>

  <div id="phase2" style="display:none">
    <div class="sub">مرحلهٔ ۲ — اطلاعات دیتابیس داخلی هاست (از بخش <b>MySQL Databases</b> سی‌پنل)</div>
    <form id="inst-form">
      <label for="db_host">سرور دیتابیس</label>
      <input id="db_host" value="localhost" />
      <label for="db_port">پورت</label>
      <input id="db_port" value="3306" inputmode="numeric" />
      <label for="db_name">نام دیتابیس</label>
      <input id="db_name" placeholder="cpaneluser_cdanesh" />
      <label for="db_user">کاربر دیتابیس</label>
      <input id="db_user" placeholder="cpaneluser_cdanesh" />
      <label for="db_pass">رمز کاربر دیتابیس</label>
      <input id="db_pass" type="password" />
      <label for="site_url">آدرس سایت</label>
      <input id="site_url" value="https://cdanesh.ir" dir="ltr" />
      <label for="admin_username">نام کاربری مدیر اولیه</label>
      <input id="admin_username" value="azarakhsh" dir="ltr" />
      <label for="admin_password">رمز موقت مدیر اولیه</label>
      <input id="admin_password" value="admin1234" dir="ltr" />
      <div class="msg warn" id="note" style="display:block;border-color:rgba(212,175,55,.4);background:rgba(212,175,55,.08);color:#e9d38a">
        ⚠️ رمز موقت پس از نصب فقط برای ورود اول است؛ پنل بلافاصله تغییر رمز (حداقل ۱۰ کاراکتر) را الزامی می‌کند. حساب مدیر با نصب مجدد بازنشانی نمی‌شود.
      </div>
      <button type="submit" id="btn-install">اجرای نصب</button>
    </form>
    <div class="msg" id="out"></div>
  </div>
</div>

<script>
const $ = (id) => document.getElementById(id);
$('btn-check').addEventListener('click', async () => {
  $('btn-check').disabled = true;
  $('btn-check').textContent = 'در حال بررسی…';
  const out = $('req-out');
  try {
    const r = await fetch('requirements.php', { cache: 'no-store' });
    const j = await r.json();
    let html = '';
    for (const [k, c] of Object.entries(j.checks || {})) {
      const cls = c.ok ? 'ok' : (k === 'node' ? 'warn' : 'bad');
      html += `<div class="${cls}">${c.ok ? '✔' : (k === 'node' ? '▲' : '✘')} ${c.hint || k}: <b>${c.value || ''}</b></div>`;
    }
    html += `<div class="${j.ok ? 'ok' : 'warn'}" style="margin-top:8px">${j.ok ? 'همهٔ پیش‌نیازها آماده است — به مرحلهٔ ۲ بروید.' : 'موارد قرمز باید در سی‌پنل فعال شوند (PHP version / Extensions).'}</div>`;
    out.innerHTML = html;
    if (j.ok) {
      $('phase1').style.display = 'none';
      $('phase2').style.display = 'block';
      $('s1').classList.remove('on'); $('s2').classList.add('on');
    }
  } catch (e) {
    out.innerHTML = '<div class="bad">✘ اجرای بررسی ناموفق بود: ' + e.message + '</div>';
  }
  $('btn-check').disabled = false;
  $('btn-check').textContent = 'شروع بررسی';
});

$('inst-form').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const btn = $('btn-install');
  btn.disabled = true; btn.textContent = 'در حال نصب…';
  const body = {
    db_host: $('db_host').value.trim(),
    db_port: parseInt($('db_port').value || '3306', 10),
    db_name: $('db_name').value.trim(),
    db_user: $('db_user').value.trim(),
    db_pass: $('db_pass').value,
    site_url: $('site_url').value.trim(),
    admin_username: $('admin_username').value.trim() || 'azarakhsh',
    admin_password: $('admin_password').value || 'admin1234',
  };
  const out = $('out');
  try {
    const r = await fetch('install.php', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json();
    out.className = 'msg ' + (j.ok ? 'ok' : 'bad');
    out.style.display = 'block';
    if (j.ok) {
      out.innerHTML = `✔ <b>نصب کامل شد</b><br>
        نسخهٔ سرور دیتابیس: <code>${j.server_version || '?'}</code> — جدول‌ها: ${j.health?.tables ?? '?'} — حساب مدیر: <b>${j.admin_created ? 'ساخته شد' : 'از قبل موجود (دست نخورد)'}</b><br>
        گام بعدی: ۱) در سی‌پنل از «Setup Node.js App» اپ را با <code>StartupFile: server.cjs</code> اجرا کنید ۲) <code>${j.admin_username}</code> را وارد پنل کنید و بلافاصله رمز را عوض کنید.`;
      $('s2').classList.add('on');
    } else {
      out.textContent = '✘ ' + (j.message || 'نصب ناموفق بود');
    }
  } catch (e) {
    out.className = 'msg bad'; out.style.display = 'block';
    out.textContent = '✘ خطای شبکه: ' + e.message;
  }
  btn.disabled = false; btn.textContent = 'اجرای نصب';
});
</script>
</body>
</html>
