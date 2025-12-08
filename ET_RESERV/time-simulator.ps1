# Script de PowerShell para controlar la simulación de tiempo
# Uso rápido para pruebas del sistema de comedor

$API_URL = "http://localhost:5269"

function Show-Menu {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "   SIMULADOR DE TIEMPO - COMEDOR" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    Write-Host "1. Ver hora actual" -ForegroundColor Yellow
    Write-Host "2. Establecer 09:30 (antes de reservaciones)" -ForegroundColor Yellow
    Write-Host "3. Establecer 10:00 (inicio reservaciones)" -ForegroundColor Green
    Write-Host "4. Establecer 13:00 (horario comida 1)" -ForegroundColor Green
    Write-Host "5. Establecer 14:00 (horario comida 2)" -ForegroundColor Green
    Write-Host "6. Establecer 15:00 (horario comida 3)" -ForegroundColor Green
    Write-Host "7. Establecer 16:30 (después de comida)" -ForegroundColor Yellow
    Write-Host "8. Establecer hora personalizada" -ForegroundColor Magenta
    Write-Host "9. Desactivar simulación (hora real)" -ForegroundColor Red
    Write-Host "0. Salir`n" -ForegroundColor White
}

function Get-TimeStatus {
    try {
        $response = Invoke-RestMethod -Uri "$API_URL/api/timesimulation/status" -Method GET
        
        Write-Host "`n📊 Estado del Tiempo:" -ForegroundColor Cyan
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
        
        if ($response.isSimulating) {
            Write-Host "🎭 MODO: " -NoNewline -ForegroundColor Yellow
            Write-Host "SIMULACIÓN ACTIVA" -ForegroundColor Green
            Write-Host "⏰ Hora Real:     " -NoNewline -ForegroundColor White
            Write-Host $response.realTime -ForegroundColor Gray
            Write-Host "🕐 Hora Simulada: " -NoNewline -ForegroundColor White
            Write-Host $response.currentTime -ForegroundColor Cyan
            Write-Host "⚙️  Offset:       " -NoNewline -ForegroundColor White
            Write-Host $response.offset -ForegroundColor DarkGray
        } else {
            Write-Host "✅ MODO: " -NoNewline -ForegroundColor Yellow
            Write-Host "HORA REAL" -ForegroundColor Green
            Write-Host "⏰ Hora Actual:   " -NoNewline -ForegroundColor White
            Write-Host $response.currentTime -ForegroundColor Cyan
        }
        
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor DarkGray
    }
    catch {
        Write-Host "❌ Error al obtener el estado del tiempo" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor DarkRed
    }
}

function Set-QuickTime {
    param([string]$preset)
    
    try {
        $response = Invoke-RestMethod -Uri "$API_URL/api/timesimulation/quick/$preset" -Method POST
        Write-Host "`n✅ $($response.message)" -ForegroundColor Green
        Start-Sleep -Seconds 1
        Get-TimeStatus
    }
    catch {
        Write-Host "`n❌ Error al establecer la hora" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor DarkRed
    }
}

function Set-CustomTime {
    Write-Host "`n⏰ Establecer hora personalizada" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    
    $hour = Read-Host "Hora (0-23)"
    $minute = Read-Host "Minutos (0-59)"
    
    try {
        $body = @{
            hour = [int]$hour
            minute = [int]$minute
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$API_URL/api/timesimulation/set" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body
        
        Write-Host "`n✅ $($response.message)" -ForegroundColor Green
        Start-Sleep -Seconds 1
        Get-TimeStatus
    }
    catch {
        Write-Host "`n❌ Error al establecer la hora" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor DarkRed
    }
}

function Clear-Simulation {
    try {
        $response = Invoke-RestMethod -Uri "$API_URL/api/timesimulation/clear" -Method POST
        Write-Host "`n✅ $($response.message)" -ForegroundColor Green
        Start-Sleep -Seconds 1
        Get-TimeStatus
    }
    catch {
        Write-Host "`n❌ Error al limpiar la simulación" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor DarkRed
    }
}

# Main Loop
Clear-Host
Write-Host "`n🍽️  Sistema de Simulación de Tiempo para Comedor`n" -ForegroundColor Green

# Verificar si el servidor está corriendo
try {
    $null = Invoke-RestMethod -Uri "$API_URL/api/timesimulation/status" -Method GET -TimeoutSec 2
    Write-Host "✅ Servidor conectado en $API_URL`n" -ForegroundColor Green
}
catch {
    Write-Host "❌ No se puede conectar al servidor en $API_URL" -ForegroundColor Red
    Write-Host "Asegúrate de que el servidor esté corriendo (dotnet run)`n" -ForegroundColor Yellow
    Read-Host "Presiona Enter para salir"
    exit
}

Get-TimeStatus

do {
    Show-Menu
    $option = Read-Host "Selecciona una opción"
    
    switch ($option) {
        "1" { Get-TimeStatus }
        "2" { Set-QuickTime "before10am" }
        "3" { Set-QuickTime "10am" }
        "4" { Set-QuickTime "lunch1" }
        "5" { Set-QuickTime "lunch2" }
        "6" { Set-QuickTime "lunch3" }
        "7" { Set-QuickTime "afterlunch" }
        "8" { Set-CustomTime }
        "9" { Clear-Simulation }
        "0" { 
            Write-Host "`n👋 ¡Hasta luego!`n" -ForegroundColor Cyan
            break 
        }
        default { 
            Write-Host "`n❌ Opción inválida. Intenta de nuevo.`n" -ForegroundColor Red
            Start-Sleep -Seconds 1
        }
    }
    
} while ($option -ne "0")
