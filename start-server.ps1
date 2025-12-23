# start-server.ps1
Write-Host "" -ForegroundColor Cyan
Write-Host " INICIANDO SERVIDOR COMEDOR - TODO EN DOCKER" -ForegroundColor Green
Write-Host "" -ForegroundColor Cyan
Write-Host ""

# Verificar que Docker Desktop est corriendo
Write-Host " Verificando Docker Desktop..." -ForegroundColor Yellow
$dockerRunning = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host " ERROR: Docker Desktop no est corriendo" -ForegroundColor Red
    Write-Host "   Por favor inicia Docker Desktop y vuelve a intentar" -ForegroundColor Yellow
    exit 1
}
Write-Host " Docker Desktop est corriendo" -ForegroundColor Green
Write-Host ""

# Detener contenedores existentes si los hay
Write-Host " Limpiando contenedores anteriores..." -ForegroundColor Yellow
docker-compose down 2>$null
Write-Host ""

# Construir e iniciar contenedores
Write-Host " Construyendo imgenes Docker..." -ForegroundColor Yellow
docker-compose build --no-cache
if ($LASTEXITCODE -ne 0) {
    Write-Host " ERROR: Fall la construccin de imgenes" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host " Iniciando contenedores..." -ForegroundColor Yellow
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host " ERROR: Fall el inicio de contenedores" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Esperar a que los servicios estn listos
Write-Host " Esperando a que los servicios estn listos..." -ForegroundColor Yellow
Write-Host "   SQL Server: Esperando 20 segundos..." -ForegroundColor Gray
Start-Sleep -Seconds 20

Write-Host "   API: Esperando 10 segundos adicionales..." -ForegroundColor Gray
Start-Sleep -Seconds 10
Write-Host ""

# Verificar estado de contenedores
Write-Host " Estado de contenedores:" -ForegroundColor Cyan
docker-compose ps
Write-Host ""

# Aplicar migraciones de base de datos
Write-Host " Aplicando migraciones de base de datos..." -ForegroundColor Yellow
Write-Host "   Esto puede tardar unos segundos..." -ForegroundColor Gray

# Aplicar migraciones desde el host (requiere dotnet-ef instalado)
cd ET_RESERV\BackEnd\ComedorSalaApi
$connectionString = "Server=localhost,1433;Database=ComedorDB;User Id=sa;Password=YourStrong@Passw0rd123;TrustServerCertificate=True;Encrypt=False;"

try {
    dotnet ef database update --connection $connectionString 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " [OK] Migraciones aplicadas correctamente" -ForegroundColor Green
    } else {
        Write-Host "  [WARNING] Error al aplicar migraciones. Verifica que dotnet-ef est instalado:" -ForegroundColor Yellow
        Write-Host "   dotnet tool install --global dotnet-ef" -ForegroundColor Gray
    }
} catch {
    Write-Host "  [WARNING] Error al aplicar migraciones: $_" -ForegroundColor Yellow
}

cd ..\..\..
Write-Host ""

# Mostrar logs de la API brevemente
Write-Host " ltimos logs de la API:" -ForegroundColor Cyan
docker logs comedor-api --tail 15
Write-Host ""

# Iniciar ngrok en una nueva ventana
Write-Host " Iniciando ngrok en puerto 5001..." -ForegroundColor Yellow
$ngrokPath = "$env:USERPROFILE\ngrok\ngrok.exe"
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
Write-Host ' NGROK - Tnel a API' -ForegroundColor Cyan
Write-Host '' -ForegroundColor Cyan
Write-Host ''
& '$ngrokPath' http 5001
"@

# Esperar a que ngrok inicie completamente
Write-Host "   Esperando a que ngrok inicie..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# Obtener la URL de ngrok automticamente
Write-Host " Detectando URL de ngrok..." -ForegroundColor Yellow
$ngrokUrl = $null
$maxRetries = 10
$retryCount = 0

while ($retryCount -lt $maxRetries -and $null -eq $ngrokUrl) {
    try {
        $ngrokApi = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction SilentlyContinue
        $ngrokUrl = $ngrokApi.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -ExpandProperty public_url -First 1
        
        if ($null -eq $ngrokUrl) {
            Write-Host "   Reintentando ($retryCount/$maxRetries)..." -ForegroundColor Gray
            Start-Sleep -Seconds 2
            $retryCount++
        }
    } catch {
        Write-Host "   Esperando a la API de ngrok ($retryCount/$maxRetries)..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
        $retryCount++
    }
}

if ($null -ne $ngrokUrl) {
    Write-Host " URL de ngrok detectada: $ngrokUrl" -ForegroundColor Green
    
    # Actualizar automticamente el apiConfig.ts
    Write-Host " Actualizando apiConfig.ts con la nueva URL..." -ForegroundColor Yellow
    $apiConfigPath = "ET_RESERV\src\apiConfig.ts"
    
    if (Test-Path $apiConfigPath) {
        $content = Get-Content $apiConfigPath -Raw
        
        # Reemplazar la URL de ngrok con regex para capturar cualquier URL anterior
        $pattern = "https://[a-zA-Z0-9\-]+\.ngrok-free\.(app|dev)"
        $newContent = $content -replace $pattern, $ngrokUrl
        
        Set-Content -Path $apiConfigPath -Value $newContent -NoNewline
        Write-Host " apiConfig.ts actualizado correctamente" -ForegroundColor Green
    } else {
        Write-Host "  No se encontr apiConfig.ts en: $apiConfigPath" -ForegroundColor Yellow
    }
} else {
    Write-Host "  No se pudo detectar la URL de ngrok automticamente" -ForegroundColor Yellow
    Write-Host "   Consulta http://localhost:4040 para obtener la URL manualmente" -ForegroundColor Gray
}
Write-Host ""

# Resumen final
Write-Host "" -ForegroundColor Cyan
Write-Host " SERVIDOR INICIADO CORRECTAMENTE" -ForegroundColor Green
Write-Host "" -ForegroundColor Cyan
Write-Host ""
Write-Host " URLs disponibles:" -ForegroundColor White
Write-Host "     SQL Server:     localhost:1433" -ForegroundColor Gray
Write-Host "      Usuario:        sa" -ForegroundColor Gray
Write-Host "      Password:       YourStrong@Passw0rd123" -ForegroundColor Gray
Write-Host ""
Write-Host "    API Local:       http://localhost:5001" -ForegroundColor Gray
Write-Host "    ngrok Web UI:    http://localhost:4040" -ForegroundColor Gray
if ($null -ne $ngrokUrl) {
    Write-Host "    URL Pblica:     $ngrokUrl" -ForegroundColor Green
} else {
    Write-Host "    URL Pblica:     Consulta http://localhost:4040" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "  PRXIMOS PASOS:" -ForegroundColor Yellow
Write-Host "   1. Inicia el frontend: cd ET_RESERV; npm run dev" -ForegroundColor White
Write-Host "   2. Accede desde la red: http://172.16.0.50:5173" -ForegroundColor White
if ($null -ne $ngrokUrl) {
    Write-Host "   3. O desde internet: $ngrokUrl (frontend usa auto-detect)" -ForegroundColor White
} else {
    Write-Host "   3. Actualiza manualmente apiConfig.ts con la URL de ngrok" -ForegroundColor White
}
Write-Host "   4. Prueba la API: http://localhost:5001/api/test" -ForegroundColor White
Write-Host ""
Write-Host " Comandos tiles:" -ForegroundColor Cyan
Write-Host "   Ver logs API:       docker logs comedor-api -f" -ForegroundColor Gray
Write-Host "   Ver logs SQL:       docker logs comedordb-sql -f" -ForegroundColor Gray
Write-Host "   Detener servidor:   .\stop-server.ps1" -ForegroundColor Gray
Write-Host "   Reiniciar:          docker-compose restart" -ForegroundColor Gray
Write-Host ""
Write-Host "" -ForegroundColor Cyan

