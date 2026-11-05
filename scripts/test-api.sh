#!/bin/bash
# تست واقعی عملکرد: ورود ادمین → CRUD کامل → فرم عمومی → بررسی پایداری داده
set -u
BASE="http://localhost:3000"
JAR="/tmp/cd_cookies.txt"
rm -f "$JAR"
PASS=0; FAIL=0

ck() { # name, condition
  if [ "$2" = "1" ]; then echo "✅ $1"; PASS=$((PASS+1)); else echo "❌ $1"; FAIL=$((FAIL+1)); fi
}

echo "══════ ۱. سلامت و صفحات عمومی ══════"
H=$(curl -s $BASE/api/health)
echo "$H" | grep -q '"ok":true' && ck "health ok" 1 || ck "health ok" 0

for p in / /services /pricing /blog /portfolio /faq /about /contact /consult /privacy /terms /sitemap.xml /robots.txt; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$p")
  [ "$code" = "200" ] && ck "GET $p → 200" 1 || ck "GET $p → $code (غیرمنتظره)" 0
done

echo "══════ ۲. محتوای صفحه اصلی از دیتابیس ══════"
curl -s $BASE/ | grep -q "هشت خدمت تخصصی" && ck "بخش خدمات رندر شده" 1 || ck "بخش خدمات" 0
curl -s $BASE/ | grep -q "۱۵,۰۰۰,۰۰۰" && ck "تعرفه‌ها از دیتابیس" 1 || ck "تعرفه‌ها" 0
curl -s $BASE/ | grep -q "درخواست مشاوره" && ck "CTA مشاوره" 1 || ck "CTA" 0
POSTS=$(curl -s $BASE/blog | grep -o "مقاله‌ای" | head -1)
curl -s $BASE/blog | grep -q "post-card" && ck "مقالات مجله رندر شده" 1 || ck "مقالات مجله" 0
SLUG=$(curl -s $BASE/blog | grep -oE '/blog/[a-z-]+' | head -1 | sed 's|/blog/||')
echo "   نمونه اسلاگ: $SLUG"
curl -s -o /dev/null -w "%{http_code}" $BASE/blog/$SLUG | grep -q 200 && ck "جزئیات مقاله 200" 1 || ck "جزئیات مقاله" 0
curl -s $BASE/services/company-website | grep -q "سایت شرکتی" && ck "صفحه خدمت 200" 1 || ck "صفحه خدمت" 0
curl -s $BASE/portfolio/rosa-shop | grep -q "رُزا" && ck "صفحه نمونه‌کار 200" 1 || ck "نمونه‌کار" 0

echo "══════ ۳. امنیت پنل ══════"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/admin/pages")
[ "$code" = "401" ] && ck "API ادمین بدون نشست → 401" 1 || ck "API ادمین بدون نشست → $code" 0
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/admin")
[ "$code" = "302" ] && ck "صفحه ادمین بدون نشست → ریدایرکت 302" 1 || ck "صفحه ادمین → $code" 0

echo "══════ ۴. ورود ادمین ══════"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE/api/auth/login -H 'content-type: application/json' -d '{"username":"admin","password":"wrong"}')
[ "$code" = "401" ] && ck "رمز غلط → 401" 1 || ck "رمز غلط → $code" 0
R=$(curl -s -c "$JAR" -X POST $BASE/api/auth/login -H 'content-type: application/json' -d '{"username":"admin","password":"cdanesh2026"}')
echo "$R" | grep -q '"ok":true' && ck "ورود موفق" 1 || ck "ورود → $R" 0
ME=$(curl -s -b "$JAR" $BASE/api/auth/me)
echo "$ME" | grep -q '"logged":true' && ck "نشست معتبر (me)" 1 || ck "me → $ME" 0
for p in /admin /admin/pages /admin/posts /admin/media /admin/messages /admin/settings /admin/services /admin/pricing /admin/faq /admin/portfolio /admin/testimonials /admin/categories; do
  code=$(curl -s -b "$JAR" -o /dev/null -w "%{http_code}" "$BASE$p")
  [ "$code" = "200" ] && ck "GET $p (با نشست) → 200" 1 || ck "GET $p → $code" 0
done

echo "══════ ۵. CRUD صفحه جدید ══════"
CREATE=$(curl -s -b "$JAR" -X POST $BASE/api/admin/pages -H 'content-type: application/json' -d '{"title":"تست صفحه آزمایشی","excerpt":"توضیح تست","content":"<h2>سلام تست</h2><p>متن آزمایشی <strong>پررنگ</strong></p><script>alert(1)</script>","status":"published","seo_title":"تست سئو","seo_description":"توضیح تست سئو"}')
PID=$(echo "$CREATE" | grep -oE '"id":[0-9]+' | head -1 | sed 's/"id"://')
PSLUG=$(echo "$CREATE" | python3 -c "import json,sys;print(json.load(sys.stdin)['data']['slug'])" 2>/dev/null || echo "")
echo "$CREATE" | grep -q '"ok":true' && ck "ایجاد صفحه → ok" 1 || ck "ایجاد صفحه → $CREATE" 0
[ -n "$PID" ] && ck "شناسه صفحه: $PID" 1 || ck "شناسه صفحه خالی" 0
echo "   اسلاگ ساخته‌شده: $PSLUG"
PUB=$(curl -s "$BASE/page/$PSLUG")
echo "$PUB" | grep -q "سلام تست" && ck "صفحه جدید عمومی رندر شد" 1 || ck "رندر صفحه جدید" 0
echo "$PUB" | grep -q "<script>alert(1)" && ck "اسکریپت خطرناک فیلتر شد ❌ باید حذف می‌شد" 0 || ck "امن‌سازی HTML (حذف script)" 1
UPD=$(curl -s -b "$JAR" -X PUT $BASE/api/admin/pages/$PID -H 'content-type: application/json' -d '{"title":"تست صفحه ویرایش‌شده","status":"draft"}')
echo "$UPD" | grep -q '"ok":true' && ck "ویرایش صفحه → ok" 1 || ck "ویرایش → $UPD" 0
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/page/$PSLUG")
[ "$code" = "302" ] && ck "پیش‌نویس → 302 به 404" 1 || ck "پیش‌نویس → $code" 0
DEL=$(curl -s -b "$JAR" -X DELETE $BASE/api/admin/pages/$PID)
echo "$DEL" | grep -q '"ok":true' && ck "حذف صفحه → ok" 1 || ck "حذف → $DEL" 0

echo "══════ ۶. CRUD مقاله + دسته ══════"
CAT=$(curl -s -b "$JAR" -X POST $BASE/api/admin/categories -H 'content-type: application/json' -d '{"name":"دسته تست","slug":"cat-test"}')
CID=$(echo "$CAT" | grep -oE '"id":[0-9]+' | head -1 | sed 's/"id"://')
echo "$CAT" | grep -q '"ok":true' && ck "ایجاد دسته → ok" 1 || ck "ایجاد دسته → $CAT" 0
POST=$(curl -s -b "$JAR" -X POST $BASE/api/admin/posts -H 'content-type: application/json' -d "{\"title\":\"مقاله تستی پنل\",\"excerpt\":\"چکیده تست\",\"content\":\"<p>بدنه تست</p>\",\"category_id\":$CID,\"tags\":[\"تست\"],\"status\":\"published\",\"reading_time\":3,\"published_at\":\"2026-11-04T09:00:00Z\"}")
POSTID=$(echo "$POST" | grep -oE '"id":[0-9]+' | head -1 | sed 's/"id"://')
POSTSLUG=$(echo "$POST" | python3 -c "import json,sys;print(json.load(sys.stdin)['data']['slug'])" 2>/dev/null || echo "")
echo "$POST" | grep -q '"ok":true' && ck "ایجاد مقاله → ok" 1 || ck "ایجاد مقاله → $POST" 0
curl -s "$BASE/blog/$POSTSLUG" | grep -q "بدنه تست" && ck "مقاله جدید عمومی رندر شد" 1 || ck "رندر مقاله جدید" 0
curl -s -b "$JAR" -X DELETE $BASE/api/admin/posts/$POSTID > /dev/null && ck "حذف مقاله" 1 || ck "حذف مقاله" 0
curl -s -b "$JAR" -X DELETE $BASE/api/admin/categories/$CID > /dev/null && ck "حذف دسته" 1 || ck "حذف دسته" 0

echo "══════ ۷. فرم عمومی ══════"
BAD=$(curl -s -X POST $BASE/api/consult -H 'content-type: application/json' -d '{"name":"x","phone":"123","message":"کم"}')
echo "$BAD" | grep -q '"ok":false' && ck "اعتبارسنجی فرم (رد داده غلط)" 1 || ck "اعتبارسنجی → $BAD" 0
GOOD=$(curl -s -X POST $BASE/api/contact -H 'content-type: application/json' -d '{"name":"رضا محمدی","phone":"09123456789","email":"r@example.com","message":"سلام، می‌خواهم درباره طراحی فروشگاه مشاوره بگیرم."}')
echo "$GOOD" | grep -q '"ok":true' && ck "ثبت پیام تماس → ok" 1 || ck "ثبت پیام → $GOOD" 0
CONS=$(curl -s -X POST $BASE/api/consult -H 'content-type: application/json' -d '{"name":"مریم اکبری","phone":"09351234567","plan_title":"سایت شرکتی (پکیج حرفه‌ای)","message":"برای شرکت ساخت‌وساز نیاز به سایت شرکتی داریم."}')
echo "$CONS" | grep -q '"ok":true' && ck "ثبت درخواست مشاوره → ok" 1 || ck "مشاوره → $CONS" 0

echo "══════ ۸. رسانه و تنظیمات ══════"
python3 -c "
from PIL import Image
im = Image.new('RGB', (320, 200), (227, 185, 83))
im.save('/tmp/test-upload.png', 'PNG')
"
UP=$(curl -s -b "$JAR" -F "file=@/tmp/test-upload.png" -F "alt=تصویر تست" $BASE/api/admin/media)
echo "$UP" | grep -q '"ok":true' && ck "آپلود تصویر → ok" 1 || ck "آپلود → $UP" 0
IMGURL=$(echo "$UP" | grep -oE '/uploads/[a-z0-9.]+')
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$IMGURL")
[ "$code" = "200" ] && ck "نمایش تصویر آپلودشده 200" 1 || ck "تصویر → $code ($IMGURL)" 0
MID=$(echo "$UP" | grep -oE '"id":[0-9]+' | head -1 | sed 's/"id"://')
curl -s -b "$JAR" -X DELETE "$BASE/api/admin/media?id=$MID" | grep -q '"ok":true' && ck "حذف رسانه" 1 || ck "حذف رسانه" 0
SET=$(curl -s -b "$JAR" -X PUT $BASE/api/admin/settings -H 'content-type: application/json' -d '{"contact":{"hours":"شنبه تا پنجشنبه ۹ تا ۶"}}')
echo "$SET" | grep -q '"ok":true' && ck "ذخیره تنظیمات → ok" 1 || ck "تنظیمات → $SET" 0
curl -s $BASE/ | grep -q "شنبه تا پنجشنبه ۹ تا ۶" && ck "تنظیمات روی سایت اعمال شد" 1 || ck "اعمال تنظیمات" 0

echo "══════ ۹. خروج ══════"
curl -s -b "$JAR" -c "$JAR" -X POST $BASE/api/auth/logout | grep -q '"ok":true' && ck "خروج → ok" 1 || ck "خروج" 0
code=$(curl -s -b "$JAR" -o /dev/null -w "%{http_code}" $BASE/api/admin/pages)
[ "$code" = "401" ] && ck "بعد از خروج → 401" 1 || ck "بعد از خروج → $code" 0

echo ""
echo "══════ نتیجه: $PASS موفق / $FAIL ناموفق ══════"
