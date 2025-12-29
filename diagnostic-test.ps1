# Script de diagnóstico para verificar el API en producción
# Ejecutar: .\diagnostic-test.ps1

$apiUrl = "https://comedorsalaapi-cpbbfna7e2h5gght.westus2-01.azurewebsites.net"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DIAGNÓSTICO DE API EN PRODUCCIÓN" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Verificar que el API esté en línea
Write-Host "[TEST 1] Verificando conectividad del API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$apiUrl/api/test" -Method GET -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ API está en línea (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "✗ Error al conectar con el API:" -ForegroundColor Red
    Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Verificar endpoint de login
Write-Host "`n[TEST 2] Probando endpoint de Login..." -ForegroundColor Yellow
$loginBody = @{
    email = "test@example.com"
    password = "test123"
    requestedRole = "empleado"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "$apiUrl/api/auth/login" -Method POST `
        -Body $loginBody -ContentType "application/json" -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ Endpoint de login responde (Status: $($loginResponse.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "✗ Error en login (esperado si no existe el usuario):" -ForegroundColor Yellow
    Write-Host "  Status: $($_.Exception.Response.StatusCode.Value__)" -ForegroundColor Yellow
}

# Test 3: Verificar endpoint de reservations (sin auth)
Write-Host "`n[TEST 3] Probando endpoint de Reservations (sin autenticación)..." -ForegroundColor Yellow
try {
    $reservResponse = Invoke-WebRequest -Uri "$apiUrl/api/reservations/timeslots" `
        -Method GET -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ Endpoint de reservations responde sin auth" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.Value__
    if ($statusCode -eq 401) {
        Write-Host "✓ Endpoint existe pero requiere autenticación (correcto)" -ForegroundColor Green
    } else {
        Write-Host "✗ Error inesperado (Status: $statusCode)" -ForegroundColor Red
    }
}

# Test 4: Verificar CORS headers
Write-Host "`n[TEST 4] Verificando configuración CORS..." -ForegroundColor Yellow
try {
    $headers = @{
        "Origin" = "https://comedorsalaweb-b8f3hwcuhjhvh3bt.westus2-01.azurewebsites.net"
    }
    $corsResponse = Invoke-WebRequest -Uri "$apiUrl/api/test" -Method OPTIONS `
        -Headers $headers -UseBasicParsing -ErrorAction Stop
    
    Write-Host "✓ CORS configurado" -ForegroundColor Green
    Write-Host "  Access-Control-Allow-Origin: $($corsResponse.Headers['Access-Control-Allow-Origin'])" -ForegroundColor Gray
} catch {
    Write-Host "⚠ No se pudo verificar CORS (puede ser normal)" -ForegroundColor Yellow
}

# Test 5: Listar todos los endpoints disponibles
Write-Host "`n[TEST 5] Probando endpoints principales..." -ForegroundColor Yellow
$endpoints = @(
    "/api/auth/login",
    "/api/reservations/timeslots",
    "/api/reservations/my-reservations",
    "/api/roomreservations/my-reservations",
    "/api/profile/me"
)

foreach ($endpoint in $endpoints) {
    try {
        $testResponse = Invoke-WebRequest -Uri "$apiUrl$endpoint" -Method GET -UseBasicParsing -ErrorAction Stop
        Write-Host "  ✓ $endpoint (Status: $($testResponse.StatusCode))" -ForegroundColor Green
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.Value__
        if ($statusCode -eq 401 -or $statusCode -eq 405) {
            Write-Host "  ✓ $endpoint existe (Status: $statusCode)" -ForegroundColor Cyan
        } elseif ($statusCode -eq 404) {
            Write-Host "  ✗ $endpoint NO ENCONTRADO (404)" -ForegroundColor Red
        } else {
            Write-Host "  ? $endpoint (Status: $statusCode)" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "RESUMEN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "API URL: $apiUrl" -ForegroundColor White
Write-Host "`nSi ves errores 404 en los endpoints principales," -ForegroundColor Yellow
Write-Host "el problema está en el despliegue del API en Azure.`n" -ForegroundColor Yellow
