# manage-server.ps1
# Script de gestión del servidor Docker

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('logs', 'restart', 'rebuild', 'clean', 'backup', 'shell', 'db')]
    [string]$Action = 'menu'
)

function Show-Menu {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "🔧 GESTIÓN DEL SERVIDOR COMEDOR" -ForegroundColor White
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  1. Ver logs de la API" -ForegroundColor Yellow
    Write-Host "  2. Ver logs de SQL Server" -ForegroundColor Yellow
    Write-Host "  3. Reiniciar servicios" -ForegroundColor Yellow
    Write-Host "  4. Reconstruir todo (limpio)" -ForegroundColor Yellow
    Write-Host "  5. Limpiar recursos Docker" -ForegroundColor Yellow
    Write-Host "  6. Backup de base de datos" -ForegroundColor Yellow
    Write-Host "  7. Shell en contenedor API" -ForegroundColor Yellow
    Write-Host "  8. Conectar a base de datos" -ForegroundColor Yellow
    Write-Host "  9. Estado de contenedores" -ForegroundColor Yellow
    Write-Host "  0. Salir" -ForegroundColor Red
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
}

function Show-APILogs {
    Write-Host "📋 Logs de la API (Ctrl+C para salir)" -ForegroundColor Cyan
    docker logs comedor-api -f
}

function Show-SQLLogs {
    Write-Host "📋 Logs de SQL Server (Ctrl+C para salir)" -ForegroundColor Cyan
    docker logs comedordb-sql -f
}

function Restart-Services {
    Write-Host "🔄 Reiniciando servicios..." -ForegroundColor Yellow
    docker-compose restart
    Write-Host "✅ Servicios reiniciados" -ForegroundColor Green
    docker-compose ps
}

function Rebuild-All {
    Write-Host "🔨 Reconstruyendo todo desde cero..." -ForegroundColor Yellow
    Write-Host "   Esto eliminará contenedores y reconstruirá imágenes" -ForegroundColor Gray
    $confirm = Read-Host "¿Continuar? (s/n)"
    
    if ($confirm -eq 's' -or $confirm -eq 'S') {
        docker-compose down
        docker-compose build --no-cache
        docker-compose up -d
        
        Write-Host ""
        Write-Host "⏳ Esperando servicios..." -ForegroundColor Yellow
        Start-Sleep -Seconds 25
        
        Write-Host "🔄 Aplicando migraciones..." -ForegroundColor Yellow
        docker exec comedor-api dotnet ef database update --no-build
        
        Write-Host "✅ Reconstrucción completa" -ForegroundColor Green
    }
}

function Clean-Docker {
    Write-Host "🧹 Limpiando recursos Docker..." -ForegroundColor Yellow
    Write-Host "   ⚠️  Esto eliminará contenedores detenidos, redes no usadas e imágenes huérfanas" -ForegroundColor Gray
    $confirm = Read-Host "¿Continuar? (s/n)"
    
    if ($confirm -eq 's' -or $confirm -eq 'S') {
        docker system prune -f
        Write-Host "✅ Limpieza completada" -ForegroundColor Green
    }
}

function Backup-Database {
    Write-Host "💾 Creando backup de base de datos..." -ForegroundColor Yellow
    
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupFile = "backup-$timestamp.bak"
    
    docker exec comedordb-sql /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P YourStrong@Passw0rd123 -Q "BACKUP DATABASE ComedorDB TO DISK = '/var/opt/mssql/data/$backupFile'"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backup creado: $backupFile" -ForegroundColor Green
        Write-Host "   Ubicación en contenedor: /var/opt/mssql/data/$backupFile" -ForegroundColor Gray
        
        # Copiar backup a host
        Write-Host "📦 Copiando backup a host..." -ForegroundColor Yellow
        docker cp comedordb-sql:/var/opt/mssql/data/$backupFile ./$backupFile
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Backup guardado en: $(Get-Location)\$backupFile" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ Error al crear backup" -ForegroundColor Red
    }
}

function Open-APIShell {
    Write-Host "🐚 Abriendo shell en contenedor API..." -ForegroundColor Cyan
    Write-Host "   Escribe 'exit' para salir" -ForegroundColor Gray
    docker exec -it comedor-api bash
}

function Connect-Database {
    Write-Host "🗄️  Conectando a SQL Server..." -ForegroundColor Cyan
    Write-Host "   Escribe 'exit' para salir" -ForegroundColor Gray
    docker exec -it comedordb-sql /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P YourStrong@Passw0rd123
}

function Show-Status {
    Write-Host "📊 Estado de contenedores:" -ForegroundColor Cyan
    docker-compose ps
    Write-Host ""
    Write-Host "💾 Uso de volúmenes:" -ForegroundColor Cyan
    docker volume ls | findstr comedor
}

# Ejecutar según parámetro o menú
if ($Action -eq 'menu') {
    while ($true) {
        Show-Menu
        $choice = Read-Host "Selecciona una opción"
        
        switch ($choice) {
            '1' { Show-APILogs }
            '2' { Show-SQLLogs }
            '3' { Restart-Services }
            '4' { Rebuild-All }
            '5' { Clean-Docker }
            '6' { Backup-Database }
            '7' { Open-APIShell }
            '8' { Connect-Database }
            '9' { Show-Status }
            '0' { 
                Write-Host "👋 ¡Hasta luego!" -ForegroundColor Green
                exit 
            }
            default { 
                Write-Host "❌ Opción inválida" -ForegroundColor Red 
            }
        }
        
        Write-Host ""
        Read-Host "Presiona Enter para continuar"
    }
} else {
    # Ejecutar acción directa
    switch ($Action) {
        'logs' { Show-APILogs }
        'restart' { Restart-Services }
        'rebuild' { Rebuild-All }
        'clean' { Clean-Docker }
        'backup' { Backup-Database }
        'shell' { Open-APIShell }
        'db' { Connect-Database }
    }
}
