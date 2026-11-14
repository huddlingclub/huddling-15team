# Node 없이 미리보기용 단일 HTML(preview.html)을 만듭니다.
# src의 TSX 소스를 그대로 이어 붙이고, 브라우저에서 Babel로 변환해 실행합니다.
# (정식 빌드는 npm install && npm run dev / npm run build)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$order = @(
  'src/constants.ts',
  'src/lib/time.ts',
  'src/lib/sunset.ts',
  'src/lib/share.ts',
  'src/components/PixelArt.tsx',
  'src/components/Penguin.tsx',
  'src/components/Scenery.tsx',
  'src/components/ui.tsx',
  'src/screens/SelectScreen.tsx',
  'src/screens/ResultScreen.tsx',
  'src/screens/GuideScreen.tsx',
  'src/App.tsx'
)
$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('const { useState, useEffect, useMemo, useRef, useCallback } = React;')
foreach ($f in $order) {
  $lines = Get-Content -LiteralPath (Join-Path $root $f) -Encoding UTF8
  [void]$sb.AppendLine("// ---- $f ----")
  foreach ($l in $lines) {
    if ($l -match '^\s*import\s') { continue }
    $l = $l -replace '^export default ', '' -replace '^export ', ''
    [void]$sb.AppendLine($l)
  }
}
[void]$sb.AppendLine('ReactDOM.createRoot(document.getElementById("root")).render(<App />);')
$code = $sb.ToString()

$css = (Get-Content -LiteralPath (Join-Path $root 'src/index.css') -Encoding UTF8 | Where-Object { $_ -notmatch '^@tailwind' }) -join "`n"

$html = @"
<!doctype html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#1d1a3a" />
<title>산셋 SUNSET · 펭산이의 하산 대작전</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@500;700;900&family=Press+Start+2P&display=swap" rel="stylesheet" />
<script src="https://cdn.tailwindcss.com/3.4.16"></script>
<script>
tailwind.config = { theme: { extend: {
  colors: { night:'#1d1a3a', ink:'#2a2350', cream:'#fdf3dc', tan:'#e7cf9f', sunny:'#ffd43b', lav:'#dcd7ff', go:'#2fb344', warn:'#f2a900', stop:'#e03131' },
  fontFamily: { pixel:['"Press Start 2P"','monospace'], kr:['"Noto Sans KR"','system-ui','sans-serif'] }
} } };
</script>
<style>
$css
</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js"></script>
</head>
<body>
<div id="root"></div>
<script type="text/plain" id="app-src">
$code
</script>
<script>
  try {
    var src = document.getElementById('app-src').textContent;
    var out = Babel.transform(src, {
      filename: 'app.tsx',
      presets: [['typescript', { isTSX: true, allExtensions: true }], ['react']]
    }).code;
    new Function(out)();
  } catch (e) {
    document.getElementById('root').innerHTML = '<pre style="color:#fff;white-space:pre-wrap;padding:16px">' + String(e && e.stack || e) + '</pre>';
    console.error(e);
  }
</script>
</body>
</html>
"@
$outPath = Join-Path $root 'preview.html'
[System.IO.File]::WriteAllText($outPath, $html, (New-Object System.Text.UTF8Encoding($false)))
Write-Output "wrote $outPath ($((Get-Item $outPath).Length) bytes)"
