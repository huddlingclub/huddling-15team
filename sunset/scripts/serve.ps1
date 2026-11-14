# Minimal static server for preview.html (no Node required)
param([int]$Port = 5180)
$root = Split-Path -Parent $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Output "Serving $root at http://localhost:$Port/"
$types = @{ '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript'; '.css' = 'text/css'; '.svg' = 'image/svg+xml'; '.png' = 'image/png'; '.json' = 'application/json' }
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
  # Build helper: POST /__save/<name> writes the body to build/<name> (used by build-deploy step)
  if ($ctx.Request.HttpMethod -eq 'POST' -and $path -match '^__save/([A-Za-z0-9._-]+)$') {
    $name = $Matches[1]
    $dir = Join-Path $root 'build'
    New-Item -ItemType Directory -Force $dir | Out-Null
    $reader = New-Object IO.StreamReader($ctx.Request.InputStream, [Text.Encoding]::UTF8)
    [IO.File]::WriteAllText((Join-Path $dir $name), $reader.ReadToEnd(), (New-Object Text.UTF8Encoding($false)))
    $ctx.Response.StatusCode = 204
    $ctx.Response.Close()
    continue
  }
  if ([string]::IsNullOrEmpty($path)) { $path = 'preview.html' }
  $file = Join-Path $root $path
  $full = [IO.Path]::GetFullPath($file)
  if ($full.StartsWith($root) -and (Test-Path -LiteralPath $full -PathType Leaf)) {
    $bytes = [IO.File]::ReadAllBytes($full)
    $ext = [IO.Path]::GetExtension($full).ToLower()
    $ctx.Response.ContentType = $(if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' })
    $ctx.Response.Headers.Add('Cache-Control', 'no-store')
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $ctx.Response.StatusCode = 404
  }
  $ctx.Response.Close()
}
