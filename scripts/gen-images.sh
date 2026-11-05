#!/bin/bash
# تولید تصاویر سه‌بعدی ایزومتریک با هویت بصری کافه‌دانش (تیره + طلایی)
# سبک ثابت برای همهٔ تصاویر تا مجموعه یکدست و حرفه‌ای باشد.
set -u
OUT=/home/z/my-project/assets-src
WEBP=/home/z/my-project/public/img
mkdir -p "$OUT" "$WEBP"

STYLE="premium 3D isometric illustration for a luxury digital agency, deep dark espresso brown background, luxurious gold and warm cream accents with subtle purple glow, soft studio lighting, floating geometric shapes, octane render, highly detailed, clean minimal composition, no text, no letters, no words"

gen() {
  local name="$1"; local size="$2"; local subject="$3"; local q="${4:-82}"
  local png="$OUT/$name.png"; local webp="$WEBP/$name.webp"
  if [ -s "$webp" ]; then echo "SKIP $name (exists)"; return 0; fi
  for attempt in 1 2 3; do
    echo ">>> $name (attempt $attempt)"
    if z-ai image -p "$subject, $STYLE" -o "$png" -s "$size" >/dev/null 2>&1; then
      if [ -s "$png" ]; then
        python3 - "$png" "$webp" "$q" <<'PYEOF'
import sys
from PIL import Image
src, dst, q = sys.argv[1], sys.argv[2], int(sys.argv[3])
im = Image.open(src).convert('RGB')
# حداکثر عرض 1280 برای وزن کمتر
if im.width > 1280:
    h = int(im.height * 1280 / im.width)
    im = im.resize((1280, h), Image.LANCZOS)
im.save(dst, 'WEBP', quality=q, method=6)
print('saved', dst, im.size)
PYEOF
        rm -f "$png"
        return 0
      fi
    fi
    sleep 3
  done
  echo "FAILED $name"
  return 1
}

# هیرو (عریض)
gen hero-main 1344x768 "isometric 3D website builder scene with floating browser windows, golden growth chart rising, small rocket, coffee cup"
# خدمات
gen svc-company 1152x864 "isometric 3D corporate office building with large website browser window, business meeting table, growth chart"
gen svc-ecommerce 1152x864 "isometric 3D online store: shopping cart with product boxes, smartphone with shop app, credit card payment, delivery box"
gen svc-speed 1152x864 "isometric 3D speedometer gauge at maximum, lightning bolt, rocket boost trail, performance meter dial"
gen svc-uiux 1152x864 "isometric 3D UX design scene: wireframe screens, color palette swatches, user flow arrows, pen tool cursor"
gen svc-seo 1152x864 "isometric 3D search engine optimization: giant magnifying glass over search results list, rising ranking bar graph, keyword tags"
gen svc-content 1152x864 "isometric 3D content writing: floating blog article pages, fountain pen writing, document stack, editing checklist"
gen svc-support 1152x864 "isometric 3D website protection: golden shield with checkmark, headset support person icon, wrench, secure lock"
gen svc-ai 1152x864 "isometric 3D AI assistant: friendly robot with chat bubbles, neural network nodes, automation gears, smart chip"
# درباره ما
gen about-studio 1152x864 "isometric 3D creative digital studio: designer desk with monitor showing website design, coffee machine, plants, drawing tablet, happy team figures"
# نمونه‌کارها
gen pf-rosa 1344x768 "isometric 3D fresh grocery online store: fruit and vegetable boxes, delivery van, shop storefront window"
gen pf-arman 1344x768 "isometric 3D corporate holding group: three connected office towers, handshake emblem, B2B documents"
gen pf-negar 1344x768 "isometric 3D AI chatbot product landing: floating chat conversation bubbles, SaaS dashboard, subscription plans cards"
# مقالات (۳ تصویر اختصاصی)
gen post-cost 1344x768 "isometric 3D budget calculator with price tags, stacked golden coins, invoice document, price comparison"
gen post-custom 1344x768 "isometric 3D contrast: unique tailor-made crafted website on one side and identical grey template blocks on other side"
gen post-local 1344x768 "isometric 3D local business map: location pin, small neighborhood shop building, megaphone, walking customer figures"
# OG
if [ ! -s "$WEBP/og-default.webp" ] && [ -s "$WEBP/hero-main.webp" ]; then
  python3 - "$WEBP/hero-main.webp" "$WEBP/og-default.webp" <<'PYEOF'
import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB')
w, h = im.size
target = 1200 / 630
if w / h > target:
    nw = int(h * target); x = (w - nw) // 2; im = im.crop((x, 0, x + nw, h))
else:
    nh = int(w / target); y = (h - nh) // 2; im = im.crop((0, y, w, y + nh))
im = im.resize((1200, 630), Image.LANCZOS)
im.save(sys.argv[2], 'WEBP', quality=80, method=6)
print('saved og-default')
PYEOF
fi

echo "=== DONE. Files: ==="
ls -la "$WEBP"
