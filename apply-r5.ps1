# ============================================================
#  cdanesh.ir  -  r5 speed patch  (apply-r5.ps1)
#  What it does:
#    1) Adds Cache-Control rules to vercel.json  (merge, never overwrite)
#    2) Adds font preload + media preconnect to src\components\PageHead.astro
#  Safe to run twice (idempotent). It never touches other files.
#  Run from the repo root:
#    powershell -ExecutionPolicy Bypass -File apply-r5.ps1
# ============================================================
$ErrorActionPreference = "Stop"

$root = Get-Location
if (-not (Test-Path (Join-Path $root "package.json"))) {
  Write-Host "[X] package.json not found here. Run this from the repo root (E:\myProject\cdanesh-astro)"
  exit 1
}
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

# ---------- 1) vercel.json : add cache rules ----------
$vj = Join-Path $root "vercel.json"
if (-not (Test-Path $vj)) {
  Write-Host "[X] vercel.json not found in repo root - cannot continue safely."
  exit 1
}
$cfg = Get-Content $vj -Raw | ConvertFrom-Json
if (-not $cfg.headers) {
  Write-Host "[X] vercel.json has no headers array - manual merge needed (see guide)."
  exit 1
}
$rules = @(
  @{ s = "/assets/fonts/(.*)"; v = "public, max-age=31536000, immutable" },
  @{ s = "/assets/img/(.*)";   v = "public, max-age=2592000" },
  @{ s = "/blog";              v = "public, s-maxage=30, stale-while-revalidate=120" },
  @{ s = "/blog/(.*)";         v = "public, s-maxage=30, stale-while-revalidate=120" },
  @{ s = "/p/(.*)";            v = "public, s-maxage=30, stale-while-revalidate=120" }
)
$all = @($cfg.headers)
$existing = @($all | ForEach-Object { $_.source })
$added = 0
foreach ($r in $rules) {
  if ($existing -notcontains $r.s) {
    $all += [pscustomobject]@{ source = $r.s; headers = @([pscustomobject]@{ key = "Cache-Control"; value = $r.v }) }
    $added++
  }
}
if ($added -gt 0) {
  $cfg.headers = $all
  $json = $cfg | ConvertTo-Json -Depth 12
  [IO.File]::WriteAllText($vj, $json + "`n", $utf8NoBom)
  Write-Host "[OK] vercel.json updated - $added cache rule(s) added"
} else {
  Write-Host "[=] vercel.json already has the r5 cache rules - skipped"
}

# ---------- 2) PageHead.astro : preload fonts + preconnect ----------
$ph = Join-Path $root "src\components\PageHead.astro"
if (-not (Test-Path $ph)) {
  Write-Host "[X] src\components\PageHead.astro not found - check the folder name."
  exit 1
}
$html = [IO.File]::ReadAllText($ph)
if ($html -match 'Vazirmatn-Regular\.woff2') {
  Write-Host "[=] PageHead.astro already patched - skipped"
} else {
  $anchor = '<meta name="viewport" content="width=device-width, initial-scale=1.0" />'
  if (-not $html.Contains($anchor)) {
    Write-Host "[X] anchor line not found in PageHead.astro - apply manually (see guide)."
    exit 1
  }
  $nl = if ($html.Contains("`r`n")) { "`r`n" } else { "`n" }
  $block = (@(
    '  <!-- r5 speed: preload main fonts + preconnect to media storage -->',
    '  <link rel="preload" as="font" type="font/woff2" href="/assets/fonts/Vazirmatn-Regular.woff2" crossorigin />',
    '  <link rel="preload" as="font" type="font/woff2" href="/assets/fonts/Vazirmatn-ExtraBold.woff2" crossorigin />',
    '  <link rel="preconnect" href="https://cu4y91gbp1mijzgc.public.blob.vercel-storage.com" />'
  ) -join $nl)
  $html = $html.Replace($anchor, $anchor + $nl + $block)
  [IO.File]::WriteAllText($ph, $html, $utf8NoBom)
  Write-Host "[OK] PageHead.astro patched - 2 font preloads + 1 preconnect added"
}

Write-Host ""
Write-Host "r5 patch finished. Next steps (copy one by one):"
Write-Host "  git add -A"
Write-Host '  git commit -m "r5 speed"'
Write-Host "  git push origin main"
Write-Host "  vercel --prod"
