$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$configPath = Join-Path $root '.cloudflared\config.yml'
$stdoutPath = Join-Path $root 'cloudflared.stdout.log'
$stderrPath = Join-Path $root 'cloudflared.stderr.log'

Start-Process `
  -FilePath 'cloudflared' `
  -ArgumentList @('tunnel', '--config', $configPath, 'run', 'terarium-tutorial') `
  -WorkingDirectory $root `
  -WindowStyle Hidden `
  -RedirectStandardOutput $stdoutPath `
  -RedirectStandardError $stderrPath
