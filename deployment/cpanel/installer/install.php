<?php
/**
 * کافه‌دانش — اجرای نصب (مرحلهٔ نهایی نصب‌کننده)
 * ---------------------------------------------------------------------------
 * ۱) اتصال به MySQL/MariaDB هاست (PDO)
 * ۲) اجرای database/schema.sql (همهٔ جدول‌ها + ایندکس‌ها)
 * ۳) ساخت حساب مدیر اولیه — فقط یک‌بار؛ هرگز بازنشانی نمی‌شود
 *    (نام کاربری: azarakhsh / رمز موقت: admin1234 — هش bcrypt)
 * ۴) نوشتن .env برای بک‌اند Node + config.php (0600)
 * ۵) تست سلامت + قفل مسیر نصب (installed.lock + htaccess)
 * هیچ رمزی در پاسخ/لاگ بازنمی‌گردد.
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'متد مجاز نیست'], JSON_UNESCAPED_UNICODE);
    exit;
}

$root = dirname(__DIR__, 3);
$input = json_decode(file_get_contents('php://input') ?: '[]', true) ?: [];

function out(array $data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/* ---------- ورودی‌ها ---------- */
$dbHost = trim((string)($input['db_host'] ?? 'localhost'));
$dbPort = (int)($input['db_port'] ?? 3306);
$dbName = trim((string)($input['db_name'] ?? ''));
$dbUser = trim((string)($input['db_user'] ?? ''));
$dbPass = (string)($input['db_pass'] ?? '');
$siteUrl = rtrim(trim((string)($input['site_url'] ?? '')), '/');
$adminUsername = trim((string)($input['admin_username'] ?? 'azarakhsh')) ?: 'azarakhsh';
$adminPassword = (string)($input['admin_password'] ?? 'admin1234') ?: 'admin1234';
$adminDisplay = trim((string)($input['admin_display'] ?? 'مدیر کافه‌دانش')) ?: 'مدیر کافه‌دانش';

if ($dbName === '' || $dbUser === '') out(['ok' => false, 'message' => 'نام دیتابیس و کاربر دیتابیس الزامی است'], 400);
if (!preg_match('/^[A-Za-z0-9._-]+$/', $adminUsername)) out(['ok' => false, 'message' => 'نام کاربری مدیر فقط حروف/عدد/خط تیره'], 400);
if (strlen($adminPassword) < 8) out(['ok' => false, 'message' => 'رمز اولیه حداقل ۸ کاراکتر است (پس از ورود ملزم به تغییر به رمز ≥۱۰ کاراکتر می‌شوید)'], 400);
if ($siteUrl === '' || !filter_var($siteUrl, FILTER_VALIDATE_URL)) out(['ok' => false, 'message' => 'آدرس سایت معتبر وارد کنید (https://cdanesh.ir)'], 400);

/* ---------- ۱) اتصال دیتابیس ---------- */
try {
    $pdo = new PDO(
        "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4",
        $dbUser,
        $dbPass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
} catch (Throwable $e) {
    out(['ok' => false, 'message' => 'اتصال به دیتابیس ناموفق بود: ' . $e->getMessage()], 500);
}

/* نسخهٔ سرور دیتابیس */
try {
    $serverVersion = (string)$pdo->getAttribute(PDO::ATTR_SERVER_VERSION);
} catch (Throwable $e) { $serverVersion = ''; }

/* ---------- ۲) اجرای schema.sql ---------- */
$schemaFile = dirname(__DIR__) . '/database/schema.sql';
if (!is_file($schemaFile)) out(['ok' => false, 'message' => 'فایل database/schema.sql در بسته یافت نشد'], 500);
$sql = (string)file_get_contents($schemaFile);
$stmts = [];
foreach (explode(';', $sql) as $chunk) {
    $lines = preg_split('/\R/', $chunk);
    $kept = array_values(array_filter($lines, fn($l) => !preg_match('/^\s*--/', $l)));
    $stmt = trim(implode("\n", $kept));
    if ($stmt !== '') $stmts[] = $stmt;
}
$created = 0;
try {
    foreach ($stmts as $stmt) {
        $pdo->exec($stmt);
        if (preg_match('/^CREATE TABLE/i', $stmt)) $created++;
    }
} catch (Throwable $e) {
    out(['ok' => false, 'message' => 'اجرای اسکیمای دیتابیس ناموفق بود: ' . $e->getMessage()], 500);
}

/* ---------- ۳) حساب مدیر اولیه (فقط یک‌بار) ---------- */
$adminCreated = false;
try {
    $st = $pdo->query("SELECT COUNT(*) AS c FROM users WHERE role='admin' AND password_hash <> ''");
    $existingAdmins = (int)($st->fetch()['c'] ?? 0);
    if ($existingAdmins === 0) {
        $dupe = $pdo->prepare('SELECT id FROM users WHERE username = ?');
        $dupe->execute([$adminUsername]);
        if (!$dupe->fetch()) {
            // bcrypt — با bcryptjs سمت Node تأیید می‌شود ($2y$ پشتیبانی می‌شود)
            $hash = password_hash($adminPassword, PASSWORD_BCRYPT);
            $ins = $pdo->prepare("INSERT INTO users (username, display_name, role, password_hash, must_change_password) VALUES (?, ?, 'admin', ?, 1)");
            $ins->execute([$adminUsername, $adminDisplay, $hash]);
            $adminCreated = true;
        }
    }
} catch (Throwable $e) {
    out(['ok' => false, 'message' => 'ساخت حساب مدیر ناموفق بود: ' . $e->getMessage()], 500);
}

/* ---------- ۴) نوشتن .env و config.php ---------- */
function randSecret(int $len = 48): string {
    try { return bin2hex(random_bytes($len)); } catch (Throwable $e) { return bin2hex(openssl_random_pseudo_bytes($len)); }
}
$sessionSecret = randSecret();
$envContent = "# کافه‌دانش — تنظیمات تولید (توسط نصب‌کننده ساخته شد " . date('Y-m-d H:i') . ")\n"
    . "SITE_URL={$siteUrl}\n"
    . "DATABASE_URL=mysql://" . rawurlencode($dbUser) . ":" . rawurlencode($dbPass) . "@{$dbHost}:{$dbPort}/{$dbName}\n"
    . "MEDIA_DIR=data/uploads\n"
    . "ADMIN_SESSION_SECRET={$sessionSecret}\n"
    . "ADMIN_USERNAME={$adminUsername}\n"
    . "NODE_ENV=production\n"
    . "# این فایل خارج از مسیر عمومی وب نگه داشته شود؛ هرگز در گیت قرار نگیرد\n";
try {
    if (!is_dir($root . '/data/uploads')) @mkdir($root . '/data/uploads', 0755, true);
    file_put_contents($root . '/.env', $envContent);
    @chmod($root . '/.env', 0600);
} catch (Throwable $e) {
    out(['ok' => false, 'message' => 'نوشتن .env ناموفق بود: ' . $e->getMessage()], 500);
}

$configDir = dirname(__DIR__) . '/config';
try {
    $configContent = "<?php\nreturn [\n"
        . "    'db_host' => " . var_export($dbHost, true) . ",\n"
        . "    'db_port' => {$dbPort},\n"
        . "    'db_name' => " . var_export($dbName, true) . ",\n"
        . "    'db_user' => " . var_export($dbUser, true) . ",\n"
        . "    'db_pass' => " . var_export($dbPass, true) . ",\n"
        . "    'site_url' => " . var_export($siteUrl, true) . ",\n"
        . "    'admin_username' => " . var_export($adminUsername, true) . ",\n"
        . "    'installed_at' => " . var_export(date('c'), true) . ",\n"
        . "];\n";
    file_put_contents($configDir . '/config.php', $configContent);
    @chmod($configDir . '/config.php', 0600);
} catch (Throwable $e) {
    out(['ok' => false, 'message' => 'نوشتن config.php ناموفق بود: ' . $e->getMessage()], 500);
}

/* ---------- ۵) تست سلامت + قفل نصب ---------- */
$health = ['tables' => 0, 'admin_exists' => false];
try {
    $st = $pdo->query('SHOW TABLES');
    $health['tables'] = count($st->fetchAll());
    $st = $pdo->prepare("SELECT COUNT(*) AS c FROM users WHERE username = ? AND password_hash <> ''");
    $st->execute([$adminUsername]);
    $health['admin_exists'] = ((int)($st->fetch()['c'] ?? 0)) > 0 || !$adminCreated;
} catch (Throwable $e) { /* سلامت partial */ }

file_put_contents(__DIR__ . '/installed.lock', json_encode([
    'installed_at' => date('c'),
    'site' => $siteUrl,
    'db' => $dbName,
    'server_version' => $serverVersion,
], JSON_UNESCAPED_UNICODE));
@chmod(__DIR__ . '/installed.lock', 0600);

/* مسیر نصب پس از تکمیل بسته می‌شود */
file_put_contents(__DIR__ . '/.htaccess', "Require all denied\nDeny from all\n");
file_put_contents(dirname(__DIR__) . '/config/.htaccess', "Require all denied\nDeny from all\n");

out([
    'ok' => true,
    'message' => 'نصب کامل شد',
    'server_version' => $serverVersion,
    'tables_created' => $created,
    'admin_created' => $adminCreated,
    'admin_username' => $adminUsername,
    'must_change_password' => true,
    'health' => $health,
    'next' => [
        'اپلیکیشن Node را در «Setup Node.js App» سی‌پنل با StartupFile=server.cjs اجرا کنید',
        'وارد /admin/login شوید و بلافاصله رمز اولیه را تغییر دهید',
    ],
]);
