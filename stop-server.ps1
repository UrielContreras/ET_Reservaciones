# stop-server.ps1
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "DETENIENDO SERVIDOR COMEDOR" -ForegroundColor Red
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

# Detener ngrok
Write-Host "Deteniendo ngrok..." -ForegroundColor Yellow
$ngrokProcesses = Get-Process | Where-Object {$_.ProcessName -like "*ngrok*"}
if ($ngrokProcesses) {
    try {
        $ngrokProcesses | Stop-Process -Force -ErrorAction Stop
        Write-Host "[OK] ngrok detenido" -ForegroundColor Green
    } catch {
        Write-Host "[INFO] No se pudo detener ngrok automaticamente (cierra la ventana manualmente)" -ForegroundColor Yellow
    }
} else {
    Write-Host "[INFO] ngrok no estaba corriendo" -ForegroundColor Gray
}
Write-Host ""

# Detener contenedores Docker
Write-Host "Deteniendo contenedores Docker..." -ForegroundColor Yellow
docker-compose down

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Contenedores detenidos correctamente" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Hubo un problema al detener los contenedores" -ForegroundColor Yellow
}
Write-Host ""

# Verificar estado
Write-Host "Verificando estado final..." -ForegroundColor Cyan
$containers = docker ps -a --filter "name=comedor" --format "{{.Names}}: {{.Status}}"
if ($containers) {
    Write-Host $containers -ForegroundColor Gray
} else {
    Write-Host "[OK] No hay contenedores activos" -ForegroundColor Green
}
Write-Host ""

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "SERVIDOR DETENIDO COMPLETAMENTE" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para volver a iniciar: .\start-server.ps1" -ForegroundColor Yellow
Write-Host ""
