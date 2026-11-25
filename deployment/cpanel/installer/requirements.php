<?php
/**
 * کافه‌دانش — بررسی پیش‌نیازهای هاست (مرحلهٔ ۱ نصب‌کننده)
 * بدون وابستگی خارجی؛ خروجی JSON.
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

/** پوشهٔ ریشهٔ اپلیکیشن (دو سطح بالاتر از deployment/cpanel/installer) */
function appRoot(): string {
    return dirname(__DIR__, 3);
}

function checkWritable(string $dir): array {
    if (!is_dir($dir)) {
        if (!@mkdir($dir, 0755, true)) {
            return ['ok' => false, 'msg' => 'ساخت پوشه ممکن نشد: ' . $dir];
        }
    }
    return ['ok' => is_writable($dir), 'msg' => is_writable($dir) ? 'قابل نوشتن' : 'قابل نوشتن نیست'];
}

$checks = [];
$root = appRoot();

/* نسخهٔ PHP */
$checks['php_version'] = [
    'ok' => version_compare(PHP_VERSION, '8.0.0', '>='),
    'value' => PHP_VERSION,
    'hint' => 'PHP 8.0 یا بالاتر (پیشنهادی: 8.1/8.2)',
];

/* افزونه‌های PHP */
foreach (['pdo_mysql' => 'اتصال MySQL/MariaDB', 'mbstring' => 'رشته‌های چندبایتی (فارسی)', 'openssl' => 'تولید کلید امن', 'json' => 'پیکربندی JSON', 'fileinfo' => 'بررسی نوع واقعی فایل'] as $ext => $why) {
    $checks['ext_' . $ext] = ['ok' => extension_loaded($ext), 'value' => extension_loaded($ext) ? 'فعال' : 'نصب نیست', 'hint' => $why];
}

/* Node.js — برای اجرای بک‌اند Astro */
$nodeVersion = '';
try {
    $nodeVersion = trim((string) shell_exec('node -v 2>/dev/null') ?: '');
} catch (\Throwable $e) { /* اجازهٔ exec نبود */ }
$checks['node'] = [
    'ok' => $nodeVersion !== '' && version_compare(ltrim($nodeVersion, 'v'), '18.17', '>='),
    'value' => $nodeVersion !== '' ? $nodeVersion : 'یافت نشد در PATH',
    'hint' => 'Node.js 18.17+ یا 20/22 LTS — باید در Application Manager پیکربندی شده باشد',
];

/* فایل‌های اجرایی سایت (dist) */
$checks['dist'] = ['ok' => is_file($root . '/dist/server/entry.mjs'), 'value' => is_file($root . '/dist/server/entry.mjs') ? 'موجود' : 'ناموجود', 'hint' => 'خروجی Build (dist/server/entry.mjs) باید در بسته باشد'];

/* دسترسی نوشتن */
foreach ([
    'write_env'    => $root,                    // برای ساخت .env
    'write_media'  => $root . '/data/uploads',  // رسانه‌ها
    'write_config' => appRoot() . '/deployment/cpanel/config',
    'write_lock'   => appRoot() . '/deployment/cpanel/installer',
] as $key => $dir) {
    $w = checkWritable($dir);
    $checks[$key] = ['ok' => $w['ok'], 'value' => $w['msg'], 'hint' => $dir];
}

/* نصب قبلی؟ */
$checks['already_installed'] = ['ok' => !is_file(__DIR__ . '/installed.lock'), 'value' => is_file(__DIR__ . '/installed.lock') ? 'قفل نصب موجود است' : 'نصب نشده', 'hint' => 'اگر قبلاً نصب کرده‌اید، پوشهٔ installer را حذف کنید'];

$allOk = true;
foreach ($checks as $key => $c) {
    if ($key === 'already_installed') continue;
    if (!$c['ok']) { $allOk = false; break; }
}
/* Node اجباری مطلق نیست اگر اجرای Node از طریق Application Manager انجام شود */
if (!$checks['node']['ok'] && $checks['dist']['ok']) {
    // هشدار گذاشته می‌شود؛ نصب ادامه می‌یابد
}

echo json_encode([
    'ok' => $allOk,
    'root' => basename($root),
    'checks' => $checks,
    'warning_node_optional' => true,
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
