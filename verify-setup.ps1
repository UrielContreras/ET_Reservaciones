# verify-setup.ps1
# Script para verificar que todo está listo para Docker

Write-Host "🔍 VERIFICACIÓN DE REQUISITOS - DOCKER SETUP" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# 1. Verificar Docker
Write-Host "1️⃣  Verificando Docker Desktop..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "   ✅ Docker instalado: $dockerVersion" -ForegroundColor Green
    
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Docker Desktop está corriendo" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Docker Desktop NO está corriendo" -ForegroundColor Red
        Write-Host "      Inicia Docker Desktop e intenta de nuevo" -ForegroundColor Yellow
        $allGood = $false
    }
} catch {
    Write-Host "   ❌ Docker NO está instalado" -ForegroundColor Red
    Write-Host "      Descarga: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    $allGood = $false
}
Write-Host ""

# 2. Verificar ngrok
Write-Host "2️⃣  Verificando ngrok..." -ForegroundColor Yellow
try {
    $ngrokVersion = ngrok version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ ngrok instalado: $ngrokVersion" -ForegroundColor Green
        
        # Verificar autenticación
        $ngrokConfig = ngrok config check 2>&1
        if ($ngrokConfig -match "valid") {
            Write-Host "   ✅ ngrok está autenticado" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  ngrok puede no estar autenticado" -ForegroundColor Yellow
            Write-Host "      Ejecuta: ngrok config add-authtoken TU_TOKEN" -ForegroundColor Gray
        }
    } else {
        throw "ngrok no encontrado"
    }
} catch {
    Write-Host "   ❌ ngrok NO está instalado" -ForegroundColor Red
    Write-Host "      Descarga: https://ngrok.com/download" -ForegroundColor Yellow
    Write-Host "      Autenticar: ngrok config add-authtoken TU_TOKEN" -ForegroundColor Yellow
    $allGood = $false
}
Write-Host ""

# 3. Verificar archivos necesarios
Write-Host "3️⃣  Verificando archivos de configuración..." -ForegroundColor Yellow
$requiredFiles = @(
    "docker-compose.yml",
    "start-server.ps1",
    "stop-server.ps1",
    "ET_RESERV\BackEnd\ComedorSalaApi\Dockerfile",
    "ET_RESERV\BackEnd\ComedorSalaApi\docker-entrypoint.sh",
    "ET_RESERV\BackEnd\ComedorSalaApi\appsettings.Production.json"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file NO ENCONTRADO" -ForegroundColor Red
        $allGood = $false
    }
}
Write-Host ""

# 4. Verificar puertos disponibles
Write-Host "4️⃣  Verificando puertos..." -ForegroundColor Yellow
$ports = @(1433, 5001, 4040)
foreach ($port in $ports) {
    $connection = netstat -ano | findstr ":$port"
    if ($connection) {
        Write-Host "   ⚠️  Puerto $port está en uso" -ForegroundColor Yellow
        Write-Host "      $connection" -ForegroundColor Gray
    } else {
        Write-Host "   ✅ Puerto $port disponible" -ForegroundColor Green
    }
}
Write-Host ""

# 5. Verificar espacio en disco
Write-Host "5️⃣  Verificando espacio en disco..." -ForegroundColor Yellow
$drive = Get-PSDrive C
$freeGB = [math]::Round($drive.Free / 1GB, 2)
if ($freeGB -gt 10) {
    Write-Host "   ✅ Espacio libre: $freeGB GB" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Espacio libre: $freeGB GB (se recomienda >10GB)" -ForegroundColor Yellow
}
Write-Host ""

# Resumen
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "✅ TODO LISTO - Puedes ejecutar .\start-server.ps1" -ForegroundColor Green
} else {
    Write-Host "⚠️  HAY PROBLEMAS - Revisa los errores arriba" -ForegroundColor Red
}
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
