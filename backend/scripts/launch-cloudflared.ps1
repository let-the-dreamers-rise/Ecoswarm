$exe = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
$log = 'C:\Users\ASHWIN GOYAL\OneDrive\Desktop\HEDER\.codex-runtime\cloudflared.log'

if (-not (Test-Path $exe)) {
  Write-Error "cloudflared.exe not found at $exe"
  exit 1
}

if (Test-Path $log) {
  Remove-Item $log -Force
}

$proc = Start-Process -FilePath $exe -ArgumentList 'tunnel', '--url', 'http://localhost:3000', '--logfile', $log -PassThru
Start-Sleep -Seconds 10

if ($proc.HasExited) {
  Write-Output "exited:$($proc.ExitCode)"
} else {
  Write-Output "running:$($proc.Id)"
}

if (Test-Path $log) {
  Get-Content $log
}
