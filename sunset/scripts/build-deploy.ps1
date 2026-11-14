# deploy/ 정적 배포 폴더를 만듭니다 (Node 불필요).
# 입력: build/app.js, build/tailwind.css  (preview 페이지에서 브라우저로 미리 컴파일한 결과)
#       src/index.css, public/favicon.svg
# 출력: deploy/index.html, deploy/assets/app.js, deploy/assets/style.css, deploy/favicon.svg
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root 'deploy'
$assets = Join-Path $out 'assets'
New-Item -ItemType Directory -Force $assets | Out-Null
$utf8 = New-Object Text.UTF8Encoding($false)

$tw = [IO.File]::ReadAllText((Join-Path $root 'build/tailwind.css'), [Text.Encoding]::UTF8)
$custom = (Get-Content -LiteralPath (Join-Path $root 'src/index.css') -Encoding UTF8 | Where-Object { $_ -notmatch '^@tailwind' }) -join "`n"
[IO.File]::WriteAllText((Join-Path $assets 'style.css'), "$tw`n$custom", $utf8)

$js = [IO.File]::ReadAllText((Join-Path $root 'build/app.js'), [Text.Encoding]::UTF8)
[IO.File]::WriteAllText((Join-Path $assets 'app.js'), "(function(){`n$js`n})();", $utf8)

Copy-Item (Join-Path $root 'public/favicon.svg') (Join-Path $out 'favicon.svg') -Force

$v = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$html = @"
<!doctype html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#1d1a3a" />
<meta name="description" content="산셋 SUNSET · 해가 지기 전, 우리의 산행. 일몰 전 안전 하산 가능 여부를 신호등으로 알려드려요." />
<meta property="og:title" content="산셋 SUNSET · 펭산이의 하산 대작전" />
<meta property="og:description" content="해가 지기 전, 우리의 산행. 미션 성공 = 안전한 귀환" />
<meta property="og:type" content="website" />
<title>산셋 SUNSET · 펭산이의 하산 대작전</title>
<link rel="icon" href="favicon.svg" type="image/svg+xml" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@500;700;900&family=Press+Start+2P&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="assets/style.css?v=$v" />
</head>
<body>
<div id="root"></div>
<noscript>자바스크립트를 켜야 산셋 SUNSET을 사용할 수 있어요.</noscript>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js" crossorigin="anonymous"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js" crossorigin="anonymous"></script>
<script src="assets/app.js?v=$v"></script>
</body>
</html>
"@
[IO.File]::WriteAllText((Join-Path $out 'index.html'), $html, $utf8)
Get-ChildItem -Recurse $out | Select-Object FullName, Length | Format-Table -AutoSize | Out-String
