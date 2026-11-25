# راهنمای نصب کافه‌دانش روی هاست ایران‌هاست (cPanel)

این راهنما برای نصب بستهٔ `cafe-danesh-cpanel-production.zip` روی هاست اشتراکی ایران‌هاست با cPanel نوشته شده است. هدف: نصب کامل سایت + پنل مدیریت روی **یک هاست، یک دیتابیس، یک بک‌اند** با **صفر وابستگی به سرویس خارجی** (بدون Neon، بدون Vercel، بدون Blob خارجی) و بدون ویرایش دستی کد.

---

## ۱. پیش‌نیازهای هاست

| مورد | حداقل | توضیح |
|---|---|---|
| Node.js | **18.17+** (پیشنهادی 20 یا 22 LTS) | از طریق «Setup Node.js App» در cPanel |
| PHP | 8.0+ (پیشنهادی 8.1/8.2) | فقط برای نصب‌کننده |
| دیتابیس | MySQL 8.0+ یا MariaDB 10.4+ | داخلی همان هاست |
| افزونه‌های PHP | pdo_mysql، mbstring، openssl، json، fileinfo | در «Select PHP Version» فعال کنید |
| فضا | حداقل ۱ گیگابایت | کد + node_modules + رسانه‌ها |
| Cron | یک Job (هر ۵ دقیقه) | برای انتشار زمان‌بندی‌شده |
| SSL | Let's Encrypt (AutoSSL) | برای کوکی Secure و HTTPS |

اگر پلن شما «Setup Node.js App» (Application Manager/Passenger) را ندارد، پیش از هر اقدامی از پشتیبانی ایران‌هاست بخواهید فعالش کنند؛ این تنها الزام معماری مهم است.

## ۲. ساخت دیتابیس و کاربر دیتابیس

1. در cPanel → **MySQL® Databases**.
2. بخش «Create New Database»: نامی مثل `cdanesh` بسازید (نام کامل با پیشوند کاربر سی‌پنل خواهد شد، مثل `cpaneluser_cdanesh`).
3. بخش «MySQL Users → Add New User»: کاربر مثل `cdanesh` بسازید و رمز قوی ثبت کنید (این رمز را فقط همین‌جا می‌دهید).
4. «Add User To Database» → کاربر را به دیتابیس اضافه کنید و در صفحهٔ بعد **ALL PRIVILEGES** را تیک بزنید.
5. این چهار مقدار را برای مرحلهٔ نصب نگه دارید: نام دیتابیس کامل، نام کاربر کامل، رمز، و سرور (معمولاً `localhost`).

## ۳. بارگذاری بستهٔ ZIP

1. در cPanel → **File Manager** → به `home/USERNAME` بروید.
2. پیشنهاد: اپ را **خارج از public_html** بگذارید؛ پوشه‌ای مثل `/home/USERNAME/cdanesh-app` بسازید.
3. ZIP را Upload کنید و با راست‌کلیک → **Extract** در همان پوشه باز کنید.
4. پس از استخراج باید این‌ها را ببینید: `dist/`، `deployment/`، `server.cjs`، `package.json`، `package-lock.json`، `src/`، `public/`.
5. اگر فایل `.htaccess` پیش‌فرضی از خودتان هست، دست نزنید؛ مال ما فقط داخل `deployment/` است.

## ۴. ساخت اپلیکیشن Node.js

1. cPanel → **Setup Node.js App** → «Create Application».
2. تنظیمات:
   - **Node.js version**: 20 LTS (یا 22).
   - **Application mode**: Production.
   - **Application root**: `cdanesh-app` (همان پوشهٔ استخراج‌شده).
   - **Application URL**: دامنهٔ سایت (`cdanesh.ir`) — همین انتخاب باعث می‌شود سی‌پنل htaccess ریشه را به اپ وصل کند.
   - **Application startup file**: `server.cjs`.
3. Create. سپس در صفحهٔ اپ، دکمهٔ **Run NPM Install** را بزنید (وابستگی‌های تولید از `package-lock.json` نصب می‌شوند؛ چند دقیقه طول می‌کشد).
4. فعلاً Start را بزنید — با خطای «DATABASE_URL تنظیم نشده» مواجه می‌شوید؛ طبیعی است تا نصب‌کننده `.env` بسازد.

## ۵. اجرای نصب‌کننده

1. در مرورگر آدرس `https://cdanesh.ir/deployment/cpanel/installer/` را باز کنید.
   - اگر آدرس خطای 404 داد، htaccess ریشه را باز کنید و مطمئن شوید Ruleها بازنویسی‌های غیرفایل را به اپ می‌فرستند (سی‌پنل به‌طور خودکار می‌نویسد).
2. **مرحلهٔ ۱**: دکمهٔ «شروع بررسی» — همهٔ موارد باید سبز باشند (Node می‌تواند زرد/هشدار باشد چون خودش از Application Manager می‌آید).
3. **مرحلهٔ ۲**: اطلاعات دیتابیس مرحلهٔ ۲ را وارد کنید؛ آدرس سایت (`https://cdanesh.ir`)، نام کاربری مدیر اولیه (پیش‌فرض `azarakhsh`) و رمز موقت (پیش‌فرض `admin1234`).
4. «اجرای نصب» → نصب‌کننده:
   - اتصال دیتابیس را تست می‌کند.
   - همهٔ جدول‌ها را می‌سازد (`deployment/cpanel/database/schema.sql`).
   - حساب مدیر اولیه را **فقط در صورت نبودِ هیچ مدیر واقعی** می‌سازد — نصب مجدد هرگز حساب موجود را بازنشانی نمی‌کند.
   - فایل `.env` را در ریشهٔ اپ می‌سازد (شامل `DATABASE_URL=mysql://…`، `ADMIN_SESSION_SECRET` تصادفی، `SITE_URL`، `MEDIA_DIR=data/uploads`).
   - `deployment/cpanel/config/config.php` را می‌نویسد (دسترسی 0600، مسیر با htaccess بسته).
   - پوشهٔ `data/uploads` را می‌سازد.
   - با `installed.lock` و `.htaccess` داخلی، **مسیر نصب را قفل می‌کند**.
5. برای امنیت بیشتر، پس از نصب موفق پوشهٔ `deployment/cpanel/installer` را از File Manager حذف کنید.

## ۶. اجرای نهایی اپ

1. به **Setup Node.js App** برگردید و اپ را **Restart** کنید.
2. در Terminal سی‌پنل می‌توانید سلامت را بگیرید:
   ```
   cd ~/cdanesh-app && bash deployment/cpanel/scripts/verify.sh
   ```
3. مرورگر: `https://cdanesh.ir` (سایت) و `https://cdanesh.ir/admin/login` (پنل).

## ۷. ورود اول و تغییر رمز

1. نام کاربری `azarakhsh` و رمز موقت `admin1234`.
2. پنل بلافاصله به صفحهٔ «حساب کاربری» می‌رود و **تغییر رمز را الزامی می‌کند**.
3. رمز جدید: حداقل ۱۰ کاراکتر، ترکیب حروف و اعداد (یا نماد)، نباید ضعیف/رایج یا یکسان با رمز فعلی باشد.
4. پس از تغییر رمز، همهٔ نشست‌های قبلی به‌طور خودکار باطل می‌شوند.

قفل ورود امنیتی: پس از **۳ تلاش ناموفق**، ورود برای **۱۵ دقیقه** بسته می‌شود (شمارش جدا برای نام کاربری و IP، در دیتابیس؛ پیام خطا هرگز نمی‌گوید کدام فیلد غلط بوده).

## ۸. SSL و HTTPS

1. cPanel → **SSL/TLS Status** → برای دامنهٔ `cdanesh.ir` گزینهٔ **Run AutoSSL** (Let's Encrypt).
2. فعال‌سازی «Force HTTPS Redirect» در همان صفحه.
3. `.env` را دست نزنید؛ `SITE_URL=https://…` آماده است. کوکی نشست روی HTTPS خودکار `Secure` می‌شود.

## ۹. تنظیم Cron برای انتشار زمان‌بندی‌شده

cPanel → **Cron Jobs** → Add New:
- Schedule: هر ۵ دقیقه (`*/5 * * * *`)
- Command (مسیر Node را از Setup Node.js App ببینید؛ معمولاً یکی از این‌هاست):

```
/opt/alt/alt-nodejs20/root/usr/bin/node /home/USERNAME/cdanesh-app/scripts/cron-publish.mjs
```

یا با مسیر عمومی node:

```
node /home/USERNAME/cdanesh-app/scripts/cron-publish.mjs
```

اسکریپت ایدمپوتنت است: اجرای تکراری محتوا را دوباره منتشر نمی‌کند و خطاها در «گزارش فعالیت» پنل ثبت می‌شوند. دسترسی عمومی وب به این اسکریپت وجود ندارد (فقط از خط فرمان اجرا می‌شود).

## ۱۰. پشتیبان‌گیری

- **خودکار (پیشنهادی)**: cPanel → **Backup** یا «JetBackup» زمان‌بندی کنید (Home Directory + MySQL دامنهٔ اپ).
- **Cron دستی**: یک Job روزانه:
  ```
  0 3 * * * mysqldump -u DBUSER -p'DBPASS' DBNAME > /home/USERNAME/backups/db-$(date +\%F).sql
  ```
- **از خود پنل**: محتوای سطل زباله/نسخه‌ها داخل دیتابیس ذخیره می‌شوند و با پشتیبان دیتابیس محفوظ‌اند.
- رسانه‌های آپلودی در `~/cdanesh-app/data/uploads` هستند — این پوشه هم باید در بکاپ Home Directory باشد.

## ۱۱. بازیابی اطلاعات

1. cPanel → Backup → «Restore a MySQL Database Backup» → فایل `.sql.gz` را بدهید؛ **یا** در Terminal:
   ```
   mysql -u DBUSER -p'DBPASS' DBNAME < db-2026-01-01.sql
   ```
2. فایل‌های رسانه: محتوای `data/uploads` را از بکاپ Home Directory برگردانید.
3. پس از بازیابی، در Setup Node.js App اپ را Restart کنید.

## ۱۲. به‌روزرسانی نسخه‌های بعدی

1. پشتیبان بگیرید (دیتابیس + `data/uploads`).
2. ZIP نسخهٔ جدید را در ریشهٔ اپ Extract کنید (فایل‌های dist و src جایگزین می‌شوند؛ `.env` دست‌نخورده می‌ماند).
3. `npm ci --omit=dev` (یا دکمهٔ Run NPM Install).
4. Restart اپ. مایگریشن‌های جدید افزایشی در اولین درخواست خودکار و اتمیک اجرا می‌شوند (`_migrations`).
5. برای تایپ‌چک/تست روی دستگاه توسعه: `npm run build` و `deployment/cpanel/scripts/verify.sh`.

## ۱۳. عیب‌یابی

| نشانه | علت احتمالی | راه حل |
|---|---|---|
| 503 در همهٔ صفحات | اپ Node بالا نیامده یا DATABASE_URL اشتباه است | لاگ اپ در Setup Node.js App؛ `.env` و اتصال دیتابیس را چک کنید |
| «اتصال به MySQL ناموفق» در نصب‌کننده | نام/رمز دیتابیس یا localhost | از MySQL Databases کاربر را به دیتابیس add کنید (ALL PRIVILEGES) |
| 404 در /admin | htaccess ریشه به اپ وصل نیست | در Setup Node.js App دامنهٔ اپ را همان دامنهٔ سایت انتخاب کنید |
| تصاویر آپلودی باز نمی‌شوند | دسترسی نوشتن `data/uploads` | در File Manager permission پوشه را 755 کنید و مالک درست را چک کنید |
| انتشار زمان‌بندی کار نمی‌کند | Cron ست نشده | بخش ۹ همین راهنما؛ خروجی Cron خطاها را می‌دهد |
| «ورود موقتاً مسدود» | ۳ تلاش ناموفق | ۱۵ دقیقه صبر کنید؛ این رفتار امنیتی عمدی است |
| صفحهٔ سفید پس از به‌روزرسانی | node_modules قدیمی | Run NPM Install + Restart |

## ۱۴. چک‌لیست نهایی پس از نصب

- [ ] `https://cdanesh.ir` سایت باز می‌شود (با HTTPS و قفل سبز).
- [ ] `/admin/login` صفحهٔ مشکی-طلایی باز می‌شود.
- [ ] ورود با `azarakhsh` → تغییر رمز الزامی انجام شد.
- [ ] داشبورد آمار واقعی نشان می‌دهد (اتصال: MySQL/MariaDB (هاست)).
- [ ] یک مقالهٔ آزمایشی ساختید و منتشر شد.
- [ ] یک تصویر آپلود کردید و در رسانه باز شد.
- [ ] Cron ثبت شد و `scripts/verify.sh` همه‌جا سبز است.
- [ ] پوشهٔ `deployment/cpanel/installer` حذف یا قفل شده.
- [ ] پشتیبان‌گیری زمان‌بندی‌شده فعال است.
