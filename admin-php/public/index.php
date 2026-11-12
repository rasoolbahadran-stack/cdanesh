<?php
declare(strict_types=1);

/**
 * Cafe Danesh — PHP admin application
 * Kept isolated under /admin-php; it never rewrites Astro routes or public pages.
 */
const APP_NAME = 'مدیریت کافه دانش';
const COOKIE = 'cd_php_admin';
const SESSION_TTL = 43200;

function envv(string $key, string $fallback = ''): string {
    $value = getenv($key);
    return $value === false ? $fallback : (string)$value;
}
function h(mixed $value): string {
    return htmlspecialchars((string)($value ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
function db(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;
    $url = envv('DATABASE_URL');
    if (!preg_match('~^postgres(?:ql)?://~i', $url)) {
        throw new RuntimeException('اتصال DATABASE_URL تنظیم نشده است.');
    }
    $parts = parse_url($url);
    if (!$parts || empty($parts['host']) || empty($parts['path'])) {
        throw new RuntimeException('رشته اتصال پایگاه داده معتبر نیست.');
    }
    $dsn = 'pgsql:host=' . $parts['host'] . ';port=' . ($parts['port'] ?? 5432) .
        ';dbname=' . ltrim($parts['path'], '/') . ';sslmode=require';
    $pdo = new PDO($dsn, rawurldecode($parts['user'] ?? ''), rawurldecode($parts['pass'] ?? ''), [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::ATTR_TIMEOUT => 8,
    ]);
    return $pdo;
}
function csrf(): string {
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
    return (string)$_SESSION['csrf'];
}
function check_csrf(): void {
    $posted = (string)($_POST['_csrf'] ?? '');
    if ($posted === '' || !hash_equals(csrf(), $posted)) {
        http_response_code(419);
        exit('درخواست منقضی شده است. صفحه را تازه‌سازی کنید.');
    }
}
function signed_in(): bool {
    return !empty($_SESSION['admin']) && !empty($_SESSION['expires']) && (int)$_SESSION['expires'] > time();
}
function setting(string $key): ?array {
    $stmt = db()->prepare('SELECT value FROM settings WHERE key = :key LIMIT 1');
    $stmt->execute(['key' => $key]);
    $row = $stmt->fetch();
    if (!$row) return null;
    $value = $row['value'];
    if (is_string($value)) {
        $decoded = json_decode($value, true);
        return is_array($decoded) ? $decoded : null;
    }
    return is_array($value) ? $value : null;
}
function save_setting(string $key, array $value): void {
    $stmt = db()->prepare(
        'INSERT INTO settings(key,value,updated_at) VALUES(:key,CAST(:value AS jsonb),now())
         ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=now()'
    );
    $stmt->execute(['key' => $key, 'value' => json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]);
}
function log_activity(string $type, string $entity, ?int $entityId, string $title): void {
    try {
        $stmt = db()->prepare('INSERT INTO activity(type,entity,entity_id,title,created_at) VALUES(:type,:entity,:id,:title,now())');
        $stmt->execute(['type' => $type, 'entity' => $entity, 'id' => $entityId, 'title' => mb_substr($title, 0, 240)]);
    } catch (Throwable $e) { /* activity logging must not block a valid CMS action */ }
}
function valid_slug(string $slug): string {
    $slug = trim(mb_strtolower($slug));
    $slug = preg_replace('/[^a-z0-9\-]+/u', '-', $slug) ?? '';
    return trim(preg_replace('/-+/', '-', $slug) ?? '', '-');
}
function table_columns(string $table): array {
    static $cache = [];
    if (isset($cache[$table])) return $cache[$table];
    $allowed = ['posts','pages','projects','services','categories','faqs','plans','testimonials','messages','media'];
    if (!in_array($table, $allowed, true)) return [];
    $stmt = db()->prepare("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=:table");
    $stmt->execute(['table' => $table]);
    return $cache[$table] = array_column($stmt->fetchAll(), 'column_name');
}
function entity_config(): array {
    return [
        'posts' => ['label'=>'مقالات','title'=>'title','summary'=>'excerpt','cols'=>['title'=>'عنوان','slug'=>'نشانی','category_id'=>'دسته‌بندی','status'=>'وضعیت','published_at'=>'تاریخ انتشار'],'fields'=>['title'=>'عنوان','slug'=>'نشانی انگلیسی','excerpt'=>'خلاصه','content'=>'محتوا (HTML)','cover_image'=>'آدرس تصویر شاخص','category_id'=>'شناسه دسته‌بندی','tags'=>'برچسب‌ها (JSON)','author'=>'نویسنده','status'=>'وضعیت','featured'=>'ویژه','reading_time'=>'زمان مطالعه','seo_title'=>'عنوان سئو','seo_description'=>'توضیحات سئو','canonical_url'=>'Canonical URL','og_title'=>'عنوان شبکه اجتماعی','og_description'=>'توضیحات شبکه اجتماعی','og_image'=>'تصویر شبکه اجتماعی','noindex'=>'Noindex']],
        'pages' => ['label'=>'صفحات','title'=>'title','summary'=>'excerpt','cols'=>['title'=>'عنوان','slug'=>'نشانی','status'=>'وضعیت','sort_order'=>'ترتیب'],'fields'=>['title'=>'عنوان','slug'=>'نشانی انگلیسی','excerpt'=>'خلاصه','content'=>'محتوا (HTML)','featured_image'=>'تصویر شاخص','status'=>'وضعیت','sort_order'=>'ترتیب','seo_title'=>'عنوان سئو','seo_description'=>'توضیحات سئو','canonical_url'=>'Canonical URL','og_title'=>'عنوان شبکه اجتماعی','og_description'=>'توضیحات شبکه اجتماعی','og_image'=>'تصویر شبکه اجتماعی','noindex'=>'Noindex']],
        'projects' => ['label'=>'نمونه‌کارها','title'=>'title','summary'=>'summary','cols'=>['title'=>'عنوان','category'=>'دسته','status'=>'وضعیت','sort_order'=>'ترتیب'],'fields'=>['title'=>'عنوان','slug'=>'نشانی انگلیسی','category'=>'دسته','summary'=>'خلاصه','content'=>'شرح پروژه','cover_image'=>'تصویر اصلی','preview_webp'=>'پیش‌نمایش WebP','tags'=>'برچسب‌ها (JSON)','url'=>'لینک پروژه','note'=>'یادداشت','sort_order'=>'ترتیب','status'=>'وضعیت','display_status'=>'وضعیت نمایش','gallery'=>'گالری (JSON)','seo_title'=>'عنوان سئو','seo_description'=>'توضیحات سئو','canonical_url'=>'Canonical URL','og_title'=>'عنوان شبکه اجتماعی','og_description'=>'توضیحات شبکه اجتماعی','og_image'=>'تصویر شبکه اجتماعی','noindex'=>'Noindex']],
        'services' => ['label'=>'خدمات','title'=>'title','summary'=>'short_desc','cols'=>['title'=>'عنوان','slug'=>'نشانی','status'=>'وضعیت','sort_order'=>'ترتیب'],'fields'=>['title'=>'عنوان','slug'=>'نشانی انگلیسی','icon'=>'آیکون','short_desc'=>'توضیح کوتاه','content'=>'توضیحات کامل','features'=>'امکانات (JSON)','image'=>'تصویر','sort_order'=>'ترتیب','status'=>'وضعیت','seo_title'=>'عنوان سئو','seo_description'=>'توضیحات سئو','canonical_url'=>'Canonical URL','og_title'=>'عنوان شبکه اجتماعی','og_description'=>'توضیحات شبکه اجتماعی','og_image'=>'تصویر شبکه اجتماعی','noindex'=>'Noindex']],
        'categories' => ['label'=>'دسته‌بندی‌ها','title'=>'name','summary'=>'description','cols'=>['name'=>'نام','slug'=>'نشانی','sort_order'=>'ترتیب'],'fields'=>['name'=>'نام','slug'=>'نشانی انگلیسی','description'=>'توضیحات','sort_order'=>'ترتیب']],
        'faqs' => ['label'=>'سؤالات متداول','title'=>'question','summary'=>'answer','cols'=>['question'=>'سؤال','service_slug'=>'خدمت','status'=>'وضعیت'],'fields'=>['question'=>'سؤال','answer'=>'پاسخ','service_slug'=>'شناسه خدمت','sort_order'=>'ترتیب','status'=>'وضعیت']],
        'plans' => ['label'=>'تعرفه‌ها','title'=>'title','summary'=>'description','cols'=>['title'=>'عنوان','price'=>'قیمت','status'=>'وضعیت'],'fields'=>['title'=>'عنوان','badge'=>'نشان','price'=>'قیمت','price_note'=>'توضیح قیمت','description'=>'توضیحات','features'=>'امکانات (JSON)','highlighted'=>'برجسته','cta_text'=>'متن دکمه','sort_order'=>'ترتیب','status'=>'وضعیت']],
        'testimonials' => ['label'=>'دیدگاه‌ها','title'=>'name','summary'=>'content','cols'=>['name'=>'نام','company'=>'شرکت','rating'=>'امتیاز','status'=>'وضعیت'],'fields'=>['name'=>'نام','role'=>'سمت','company'=>'شرکت','content'=>'متن دیدگاه','rating'=>'امتیاز','avatar'=>'آواتار','sort_order'=>'ترتیب','status'=>'وضعیت']],
        'messages' => ['label'=>'پیام‌ها','title'=>'name','summary'=>'message','cols'=>['name'=>'نام','email'=>'ایمیل','phone'=>'تلفن','status'=>'وضعیت','created_at'=>'تاریخ'],'fields'=>['status'=>'وضعیت','admin_note'=>'یادداشت مدیر','starred'=>'ستاره‌دار']],
        'media' => ['label'=>'رسانه‌ها','title'=>'filename','summary'=>'alt','cols'=>['filename'=>'نام فایل','mime'=>'نوع فایل','size'=>'حجم','alt'=>'متن جایگزین','created_at'=>'تاریخ'],'fields'=>['alt'=>'متن جایگزین']],
    ];
}
function route_entity(string $table): ?array {
    $cfg = entity_config();
    return isset($cfg[$table]) ? $cfg[$table] : null;
}
function column_value(array $row, string $key): string {
    $value = $row[$key] ?? '';
    if (is_array($value)) $value = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    return (string)$value;
}
function save_record(string $table, int $id, array $input): int {
    $cfg = route_entity($table);
    if (!$cfg) throw new RuntimeException('بخش موردنظر معتبر نیست.');
    $columns = table_columns($table);
    $fields = array_intersect(array_keys($cfg['fields']), $columns);
    $data = [];
    foreach ($fields as $field) {
        if (!array_key_exists($field, $input)) continue;
        $value = is_array($input[$field]) ? $input[$field][0] ?? '' : $input[$field];
        $value = trim((string)$value);
        if ($value === '' && $field === 'category_id') $value = null;
        if ($value === '' && in_array($field, ['sort_order','reading_time','rating','price'], true)) $value = '0';
        if (in_array($field, ['tags','features','gallery'], true)) {
            if ($value === '') $value = '[]';
            $parsed = json_decode($value, true);
            if (!is_array($parsed)) throw new RuntimeException('فیلدهای JSON باید آرایه یا شیء معتبر باشند: ' . $field);
            $value = json_encode($parsed, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }
        if (in_array($field, ['featured','noindex','highlighted','starred'], true)) $value = in_array(strtolower($value), ['1','true','yes','on'], true) ? 'true' : 'false';
        if ($field === 'slug') $value = valid_slug($value);
        $data[$field] = $value;
    }
    if (isset($data['title']) && trim($data['title']) === '') throw new RuntimeException('عنوان نمی‌تواند خالی باشد.');
    if (isset($data['slug']) && $data['slug'] === '') throw new RuntimeException('نشانی انگلیسی الزامی است.');
    if (!$data) throw new RuntimeException('فیلدی برای ذخیره انتخاب نشده است.');
    if ($id > 0) {
        $sets = [];
        foreach (array_keys($data) as $key) $sets[] = '"' . $key . '"=:' . $key;
        if (in_array('updated_at', $columns, true)) $sets[] = '"updated_at"=now()';
        $sql = 'UPDATE "' . $table . '" SET ' . implode(',', $sets) . ' WHERE id=:__id RETURNING id';
        $data['__id'] = $id;
        $stmt = db()->prepare($sql);
        $stmt->execute($data);
        if (!$stmt->fetchColumn()) throw new RuntimeException('رکورد موردنظر پیدا نشد.');
        log_activity('update', $table, $id, 'ویرایش ' . $cfg['label']);
        return $id;
    }
    $keys = array_keys($data);
    $quoted = array_map(static fn($k) => '"' . $k . '"', $keys);
    $params = array_map(static fn($k) => ':' . $k, $keys);
    if (in_array('created_at', $columns, true)) { $quoted[] = '"created_at"'; $params[] = 'now()'; }
    if (in_array('updated_at', $columns, true)) { $quoted[] = '"updated_at"'; $params[] = 'now()'; }
    $stmt = db()->prepare('INSERT INTO "' . $table . '" (' . implode(',', $quoted) . ') VALUES (' . implode(',', $params) . ') RETURNING id');
    $stmt->execute($data);
    $newId = (int)$stmt->fetchColumn();
    log_activity('create', $table, $newId, 'ایجاد ' . $cfg['label']);
    return $newId;
}
function redirect_to(string $url): never {
    header('Location: ' . $url, true, 303);
    exit;
}
function ai_encrypt_key(string $plain): string {
    $master = envv('ADMIN_SESSION_SECRET');
    if ($master === '') throw new RuntimeException('کلید رمزگذاری دستیار در تنظیمات سرور تعیین نشده است.');
    $key = hash('sha256', $master, true);
    $iv = random_bytes(12); $tag = '';
    $cipher = openssl_encrypt($plain, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag);
    if ($cipher === false) throw new RuntimeException('رمزگذاری کلید دستیار انجام نشد.');
    return base64_encode($iv . $tag . $cipher);
}
function ai_decrypt_key(string $encoded): string {
    $master = envv('ADMIN_SESSION_SECRET');
    if ($master === '') return '';
    $raw = base64_decode($encoded, true);
    if ($raw === false || strlen($raw) < 29) return '';
    return openssl_decrypt(substr($raw, 28), 'aes-256-gcm', hash('sha256', $master, true), OPENSSL_RAW_DATA, substr($raw,0,12), substr($raw,12,16)) ?: '';
}
function assistant_reply(string $message): string {
    $cfg = setting('admin_ai_config_php') ?? [];
    $key = ai_decrypt_key((string)($cfg['encryptedKey'] ?? ''));
    if ($key === '') throw new RuntimeException('ابتدا کلید OpenRouter را در بخش دستیار هوشمند ثبت کنید.');
    $payload = json_encode(['model' => ($cfg['model'] ?? 'openrouter/free'), 'messages' => [
        ['role'=>'system','content'=>'تو دستیار محتوایی فارسی کافه دانش هستی. پاسخ‌ها دقیق و کاربردی باشند. تغییرات سایت را بدون اقدام مدیر انجام‌شده اعلام نکن.'],
        ['role'=>'user','content'=>mb_substr($message,0,8000)]
    ], 'temperature'=>0.4], JSON_UNESCAPED_UNICODE);
    $ch = curl_init('https://openrouter.ai/api/v1/chat/completions');
    curl_setopt_array($ch, [CURLOPT_POST=>true,CURLOPT_RETURNTRANSFER=>true,CURLOPT_TIMEOUT=>35,CURLOPT_HTTPHEADER=>['Authorization: Bearer '.$key,'Content-Type: application/json','HTTP-Referer: https://cdanesh.ir','X-Title: Cafe Danesh Admin'],CURLOPT_POSTFIELDS=>$payload]);
    $response = curl_exec($ch); $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE); $error = curl_error($ch); curl_close($ch);
    if ($response === false || $status < 200 || $status >= 300) throw new RuntimeException('خطای OpenRouter: ' . ($error ?: 'HTTP ' . $status));
    $decoded = json_decode($response, true);
    $answer = $decoded['choices'][0]['message']['content'] ?? '';
    if (!is_string($answer) || trim($answer) === '') throw new RuntimeException('پاسخ معتبری از دستیار دریافت نشد.');
    return mb_substr($answer,0,15000);
}

$secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
session_name(COOKIE);
session_set_cookie_params(['lifetime'=>SESSION_TTL,'path'=>'/','secure'=>$secure,'httponly'=>true,'samesite'=>'Lax']);
ini_set('session.use_strict_mode','1');
session_start();
header('X-Robots-Tag: noindex, nofollow, noarchive');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');

$error = ''; $notice = '';
$section = (string)($_GET['section'] ?? 'dashboard');
$cfg = entity_config();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $action = (string)($_POST['action'] ?? '');
        if ($action === 'login') {
            $username = (string)($_POST['username'] ?? '');
            $password = (string)($_POST['password'] ?? '');
            $expectedUser = envv('ADMIN_USERNAME','admin');
            $expectedHash = envv('ADMIN_PASSWORD_HASH');
            $expectedPlain = envv('ADMIN_PASSWORD');
            $match = false;
            if ($expectedHash !== '') {
                if (str_starts_with($expectedHash, '$2y$') || str_starts_with($expectedHash, '$argon2')) $match = password_verify($password, $expectedHash);
                else $match = hash_equals(strtolower($expectedHash), hash('sha256',$password));
            } elseif ($expectedPlain !== '') $match = hash_equals($expectedPlain, $password);
            if (!$match || !hash_equals($expectedUser,$username)) {
                usleep(350000); throw new RuntimeException('نام کاربری یا رمز عبور صحیح نیست.');
            }
            session_regenerate_id(true);
            $_SESSION['admin'] = $username; $_SESSION['expires'] = time()+SESSION_TTL; $_SESSION['csrf'] = bin2hex(random_bytes(32));
            redirect_to('./');
        }
        if (!signed_in()) throw new RuntimeException('برای ادامه وارد پنل شوید.');
        check_csrf();
        $_SESSION['expires'] = time()+SESSION_TTL;
        if ($action === 'logout') { $_SESSION=[]; session_destroy(); redirect_to('./'); }
        if ($action === 'save') {
            $table = (string)($_POST['table'] ?? '');
            $id = save_record($table, (int)($_POST['id'] ?? 0), $_POST);
            redirect_to('?section=' . rawurlencode($table) . '&saved=' . $id);
        }
        if ($action === 'delete') {
            $table = (string)($_POST['table'] ?? '');
            $id = (int)($_POST['id'] ?? 0);
            if (!route_entity($table) || $id < 1) throw new RuntimeException('درخواست حذف معتبر نیست.');
            $stmt = db()->prepare('DELETE FROM "' . $table . '" WHERE id=:id'); $stmt->execute(['id'=>$id]);
            log_activity('delete', $table, $id, 'حذف رکورد'); redirect_to('?section=' . rawurlencode($table));
        }
        if ($action === 'save_ai') {
            $key = trim((string)($_POST['api_key'] ?? ''));
            $model = trim((string)($_POST['model'] ?? 'openrouter/free'));
            $current = setting('admin_ai_config_php') ?? [];
            if ($key !== '' && strlen($key) < 12) throw new RuntimeException('کلید API معتبر به نظر نمی‌رسد.');
            $encrypted = $key !== '' ? ai_encrypt_key($key) : (string)($current['encryptedKey'] ?? '');
            save_setting('admin_ai_config_php',['provider'=>'openrouter','model'=>mb_substr($model,0,120),'encryptedKey'=>$encrypted]);
            $notice = 'تنظیمات دستیار ذخیره شد.';
        }
        if ($action === 'ask_ai') {
            $_SESSION['ai_question'] = trim((string)($_POST['question'] ?? ''));
            $_SESSION['ai_answer'] = assistant_reply((string)$_SESSION['ai_question']);
            redirect_to('?section=assistant');
        }
    } catch (Throwable $e) { $error = $e->getMessage(); }
}
if (isset($_GET['saved'])) $notice = 'تغییرات ذخیره شد.';
if (!signed_in()):
?>
<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>ورود | کافه دانش</title><style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;background:#0c1224;color:#edf1ff;font-family:Tahoma,Arial,sans-serif;display:grid;place-items:center;padding:22px}.login{width:min(440px,100%);background:#151d35;border:1px solid #2e3b60;border-radius:22px;padding:30px;box-shadow:0 24px 70px #0006}.brand{font-size:25px;font-weight:bold;margin-bottom:8px}.muted{color:#98a7c9;line-height:1.9}.field{display:block;margin:18px 0 7px;color:#bac6e3}input{width:100%;padding:14px 15px;border-radius:11px;border:1px solid #3a496d;background:#0d152b;color:white;font:inherit}button{width:100%;margin-top:22px;padding:14px;border:0;border-radius:11px;background:#7962e8;color:white;font-weight:bold;font-size:16px;cursor:pointer}.err{margin-top:16px;padding:11px;border-radius:10px;background:#532d49;color:#ffd5e6}.foot{margin-top:22px;color:#7284ab;font-size:12px}
</style></head><body><form class="login" method="post"><div class="brand">کافه دانش</div><div class="muted">ورود به سامانه مدیریت محتوا</div><input type="hidden" name="action" value="login"><label class="field">نام کاربری</label><input name="username" autocomplete="username" required><label class="field">رمز عبور</label><input name="password" type="password" autocomplete="current-password" required><button>ورود به پنل</button><?php if($error): ?><div class="err"><?=h($error)?></div><?php endif; ?><div class="foot">سامانه مدیریت مستقل · دسترسی مدیران</div></form></body></html>
<?php
exit;
endif;

try {
    $pdo = db();
    $dashboardCounts = [];
    foreach (['posts'=>'مقاله','pages'=>'صفحه','projects'=>'نمونه‌کار','services'=>'خدمت','messages'=>'پیام','media'=>'رسانه'] as $table=>$label) {
        try { $dashboardCounts[$table] = (int)$pdo->query('SELECT COUNT(*) FROM "' . $table . '"')->fetchColumn(); }
        catch (Throwable $e) { $dashboardCounts[$table] = 0; }
    }
    $rows = [];
    if (isset($cfg[$section])) {
        $columns = table_columns($section);
        $sort = in_array('updated_at',$columns,true) ? 'updated_at' : (in_array('created_at',$columns,true) ? 'created_at' : 'id');
        $stmt = $pdo->query('SELECT * FROM "' . $section . '" ORDER BY "' . $sort . '" DESC LIMIT 100');
        $rows = $stmt->fetchAll();
    }
} catch (Throwable $e) { $error = $e->getMessage(); $dashboardCounts = []; $rows=[]; }
?>
<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title><?=h(APP_NAME)?></title><style>
:root{color-scheme:dark;--bg:#0b1020;--panel:#141d33;--panel2:#192542;--line:#2d3c61;--text:#edf2ff;--muted:#9cadd0;--accent:#8d78ef;--accent2:#56c0c8;--danger:#e06b85}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:Tahoma,Arial,sans-serif;font-size:14px}a{color:inherit;text-decoration:none}.layout{display:grid;grid-template-columns:260px minmax(0,1fr);min-height:100vh}.side{position:sticky;top:0;height:100vh;overflow:auto;background:#10182c;border-left:1px solid var(--line);padding:22px 15px}.logo{font-size:22px;font-weight:800;padding:8px 12px 24px}.logo small{display:block;font-size:11px;color:var(--muted);font-weight:400;margin-top:8px}.navhead{font-size:11px;color:#7385af;margin:20px 12px 8px}.nav a{display:block;padding:11px 13px;margin:4px 0;border-radius:10px;color:#bec9e3}.nav a:hover,.nav a.active{background:#27345a;color:white}.nav a.active{box-shadow:inset -3px 0 var(--accent)}main{min-width:0;padding:24px 28px 60px}.top{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:24px}.top h1{font-size:23px;margin:0}.muted{color:var(--muted)}.btn,button{border:0;cursor:pointer;border-radius:9px;padding:10px 15px;background:var(--accent);color:#fff;font:inherit;font-weight:700}.btn.secondary{background:#263454;color:#d7e2ff}.btn.danger{background:#6a3048}.cards{display:grid;grid-template-columns:repeat(6,minmax(110px,1fr));gap:13px}.card,.panel{background:var(--panel);border:1px solid var(--line);border-radius:15px;padding:17px}.card span{display:block;color:var(--muted);font-size:12px}.card b{display:block;font-size:27px;margin-top:8px}.panel{margin-top:20px}.panel h2{font-size:17px;margin:0 0 16px}.tablewrap{overflow:auto}table{border-collapse:collapse;width:100%;min-width:630px}th,td{text-align:right;padding:12px;border-bottom:1px solid #2a3859;vertical-align:top}th{color:#91a5cc;font-size:12px;font-weight:500}td{max-width:300px;line-height:1.7}.actions{display:flex;gap:7px;align-items:center}.actions form{margin:0}.small{font-size:12px}.pill{display:inline-block;padding:4px 8px;border-radius:20px;background:#293758;color:#cddaff;font-size:11px}.formgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}.control{display:flex;flex-direction:column;gap:7px}.control.full{grid-column:1/-1}.control label{color:#bac7e4;font-size:12px}input,textarea,select{width:100%;min-width:0;background:#0d162b;border:1px solid #344467;border-radius:9px;color:var(--text);padding:11px 12px;font:inherit}textarea{min-height:110px;resize:vertical}textarea.content{min-height:310px;line-height:1.9;font-family:Tahoma,Arial,sans-serif}.editor-tools{display:flex;gap:8px;margin-bottom:8px}.notice,.error{padding:12px 15px;border-radius:10px;margin:10px 0 18px}.notice{background:#173e3f;color:#b8f0e8}.error{background:#50273a;color:#ffdae4}.empty{padding:28px;text-align:center;color:var(--muted)}.toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:15px}.search{max-width:320px}.hint{color:var(--muted);font-size:11px;line-height:1.9}.editor-preview{background:white;color:#202438;border-radius:8px;padding:15px;min-height:180px;direction:rtl}.progress{height:7px;background:#233353;border-radius:20px;overflow:hidden}.progress i{display:block;height:100%;background:linear-gradient(90deg,var(--accent),var(--accent2))}.right{margin-right:auto}.logout{background:transparent;border:1px solid var(--line);color:#bec9e3}@media(max-width:1100px){.cards{grid-template-columns:repeat(3,minmax(100px,1fr))}}@media(max-width:760px){.layout{display:block}.side{position:relative;top:auto;height:auto;border-left:0;border-bottom:1px solid var(--line)}.nav{display:flex;overflow:auto;gap:5px}.nav a{white-space:nowrap}.navhead{display:none}main{padding:18px 13px}.cards{grid-template-columns:repeat(2,minmax(0,1fr))}.formgrid{grid-template-columns:1fr}.top h1{font-size:19px}}
</style></head><body><div class="layout"><aside class="side"><div class="logo">کافه دانش<small>سامانه مدیریت محتوا · PHP</small></div><div class="navhead">مدیریت سایت</div><nav class="nav">
<a class="<?= $section==='dashboard'?'active':'' ?>" href="./">نمای کلی</a>
<?php foreach($cfg as $key=>$item): ?><a class="<?=$section===$key?'active':''?>" href="?section=<?=h($key)?>"><?=h($item['label'])?></a><?php endforeach; ?>
<div class="navhead">ابزارها</div><a class="<?=$section==='assistant'?'active':''?>" href="?section=assistant">دستیار هوشمند</a><a class="<?=$section==='activity'?'active':''?>" href="?section=activity">گزارش فعالیت</a><a href="https://cdanesh.ir/" target="_blank" rel="noopener">مشاهده سایت ↗</a>
</nav></aside><main><div class="top"><div><h1><?=h($cfg[$section]['label']??($section==='assistant'?'دستیار هوشمند':($section==='activity'?'گزارش فعالیت':'داشبورد')))?></h1><div class="muted small">خوش آمدید، <?=h($_SESSION['admin'])?></div></div><form method="post"><input type="hidden" name="_csrf" value="<?=h(csrf())?>"><input type="hidden" name="action" value="logout"><button class="logout">خروج</button></form></div>
<?php if($notice): ?><div class="notice"><?=h($notice)?></div><?php endif; ?><?php if($error): ?><div class="error"><?=h($error)?></div><?php endif; ?>
<?php if(isset($cfg[$section])): $entity=$cfg[$section]; $editing=null; if(isset($_GET['edit'])) { $st=$pdo->prepare('SELECT * FROM "' . $section . '" WHERE id=:id');$st->execute(['id'=>(int)$_GET['edit']]);$editing=$st->fetch()?:null; } ?>
<div class="panel"><div class="toolbar"><div><h2><?= $editing?'ویرایش رکورد':'افزودن '.$entity['label'] ?></h2><div class="hint">شناسه رکورد فقط در ویرایش قابل تغییر نیست. فیلدهای سئو در صورت وجود در پایگاه داده ذخیره می‌شوند.</div></div><a class="btn secondary" href="?section=<?=h($section)?>">فهرست</a></div>
<form method="post"><input type="hidden" name="_csrf" value="<?=h(csrf())?>"><input type="hidden" name="action" value="save"><input type="hidden" name="table" value="<?=h($section)?>"><input type="hidden" name="id" value="<?=h($editing['id']??0)?>"><div class="formgrid">
<?php foreach($entity['fields'] as $field=>$label): if(!in_array($field,table_columns($section),true)) continue; $value=$editing[$field]??''; if(is_array($value)) $value=json_encode($value,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES); $isLong=in_array($field,['content','excerpt','description','answer','message','admin_note','short_desc','seo_description','og_description','features','tags','gallery'],true); $isBool=in_array($field,['featured','noindex','highlighted','starred'],true); ?>
<div class="control <?=$isLong?'full':''?>"><label><?=h($label)?></label>
<?php if($isBool): ?><select name="<?=h($field)?>"><option value="false" <?=!in_array(strtolower((string)$value),['1','true','t','yes'],true)?'selected':''?>>خیر</option><option value="true" <?=in_array(strtolower((string)$value),['1','true','t','yes'],true)?'selected':''?>>بله</option></select>
<?php elseif($field==='status'): $statusOptions = $section==='messages' ? ['new'=>'جدید','read'=>'خوانده‌شده','replied'=>'پاسخ داده شد','archived'=>'بایگانی'] : ['draft'=>'پیش‌نویس','published'=>'منتشرشده','pending'=>'در انتظار','read'=>'خوانده‌شده','archived'=>'بایگانی']; ?><select name="status"><?php foreach($statusOptions as $v=>$l): ?><option value="<?=h($v)?>" <?=((string)$value===$v)?'selected':''?>><?=h($l)?></option><?php endforeach; ?></select>
<?php elseif($isLong): ?><textarea class="<?= $field==='content'?'content':'' ?>" name="<?=h($field)?>"><?=h($value)?></textarea><?php else: ?><input name="<?=h($field)?>" value="<?=h($value)?>" <?=in_array($field,['sort_order','reading_time','rating','price','category_id'],true)?'inputmode="decimal"':''?>><?php endif; ?></div>
<?php endforeach; ?></div><p class="hint">برای فیلدهای JSON مانند برچسب‌ها و گالری، آرایهٔ JSON معتبر وارد کنید؛ نمونه: ["طراحی سایت","سئو"]</p><button>ذخیره تغییرات</button></form></div>
<div class="panel"><div class="toolbar"><h2>فهرست <?=h($entity['label'])?></h2><input class="search" id="filter" placeholder="جست‌وجو در این فهرست..."></div><div class="tablewrap"><table id="records"><thead><tr><th>شناسه</th><?php foreach($entity['cols'] as $col=>$label): if(in_array($col,table_columns($section),true)): ?><th><?=h($label)?></th><?php endif; endforeach; ?><th>عملیات</th></tr></thead><tbody>
<?php foreach($rows as $row): ?><tr><td><?=h($row['id'])?></td><?php foreach($entity['cols'] as $col=>$label): if(!in_array($col,table_columns($section),true)) continue; ?><td><?=h(mb_strimwidth(column_value($row,$col),0,90,'…'))?></td><?php endforeach; ?><td><div class="actions"><a class="btn secondary small" href="?section=<?=h($section)?>&edit=<?=h($row['id'])?>">ویرایش</a><form method="post" onsubmit="return confirm('این رکورد حذف شود؟')"><input type="hidden" name="_csrf" value="<?=h(csrf())?>"><input type="hidden" name="action" value="delete"><input type="hidden" name="table" value="<?=h($section)?>"><input type="hidden" name="id" value="<?=h($row['id'])?>"><button class="btn danger small">حذف</button></form></div></td></tr><?php endforeach; ?>
<?php if(!$rows): ?><tr><td colspan="8" class="empty">موردی ثبت نشده است.</td></tr><?php endif; ?></tbody></table></div></div>
<?php elseif($section==='assistant'): $ai=setting('admin_ai_config_php')??[]; ?>
<div class="panel"><h2>اتصال OpenRouter</h2><p class="hint">کلید API فقط به‌صورت رمزگذاری‌شده در رکورد مستقل این پنل ذخیره می‌شود و تنظیمات دستیار نسخه Astro را تغییر نمی‌دهد. به‌دلیل جدایی کلیدهای رمزگذاری، برای این نسخه باید کلید را یک‌بار دوباره وارد کنید.</p><form method="post"><input type="hidden" name="_csrf" value="<?=h(csrf())?>"><input type="hidden" name="action" value="save_ai"><div class="formgrid"><div class="control"><label>کلید API جدید</label><input type="password" name="api_key" autocomplete="new-password" placeholder="<?=!empty($ai['encryptedKey'])?'برای حفظ کلید فعلی خالی بگذارید':''?>"></div><div class="control"><label>مدل</label><input name="model" value="<?=h($ai['model']??'openrouter/free')?>"></div></div><button>ذخیره تنظیمات</button></form></div>
<div class="panel"><h2>گفت‌وگو با دستیار</h2><form method="post"><input type="hidden" name="_csrf" value="<?=h(csrf())?>"><input type="hidden" name="action" value="ask_ai"><div class="control"><label>پیام شما</label><textarea name="question" required placeholder="برای مثال: برای مقاله طراحی سایت شرکتی، عنوان سئو و ساختار پیشنهادی بده..."></textarea></div><button>دریافت پاسخ</button></form><?php if(!empty($_SESSION['ai_answer'])): ?><div class="panel" style="white-space:pre-wrap;line-height:2"><?=h($_SESSION['ai_answer'])?></div><?php endif; ?></div>
<?php elseif($section==='activity'): $activity=[];try{$activity=$pdo->query('SELECT type,entity,title,created_at FROM activity ORDER BY created_at DESC LIMIT 80')->fetchAll();}catch(Throwable $e){} ?>
<div class="panel"><h2>آخرین فعالیت‌ها</h2><div class="tablewrap"><table><thead><tr><th>نوع</th><th>بخش</th><th>شرح</th><th>زمان</th></tr></thead><tbody><?php foreach($activity as $a): ?><tr><td><?=h($a['type'])?></td><td><?=h($a['entity'])?></td><td><?=h($a['title'])?></td><td><?=h($a['created_at'])?></td></tr><?php endforeach; ?></tbody></table></div></div>
<?php else: ?>
<div class="cards"><?php foreach(($dashboardCounts??[]) as $key=>$count): ?><a class="card" href="?section=<?=h($key)?>"><span><?=h($cfg[$key]['label']??$key)?></span><b><?=h($count)?></b><div class="progress"><i style="width:<?=min(100,max(4,$count))?>%"></i></div></a><?php endforeach; ?></div>
<div class="panel"><h2>نمای کلی مدیریت</h2><p class="muted">این پنل به دیتابیس اصلی سایت متصل است. تغییرات محتوایی در همان جداول مورد استفاده Astro ذخیره می‌شوند؛ مسیرها و فایل‌های عمومی Astro مستقل و دست‌نخورده باقی می‌مانند.</p><div class="actions"><a class="btn" href="?section=posts">مدیریت مقاله‌ها</a><a class="btn secondary" href="?section=pages">مدیریت صفحات</a><a class="btn secondary" href="?section=projects">نمونه‌کارها</a></div></div>
<?php endif; ?>
<div class="hint" style="margin-top:24px">Cafe Danesh Admin · PHP · اتصال PostgreSQL · نشست امن و CSRF</div></main></div>
<script>
const filter=document.getElementById('filter');if(filter){filter.addEventListener('input',()=>{const q=filter.value.toLocaleLowerCase();document.querySelectorAll('#records tbody tr').forEach(tr=>tr.hidden=!tr.innerText.toLocaleLowerCase().includes(q));});}
</script></body></html>