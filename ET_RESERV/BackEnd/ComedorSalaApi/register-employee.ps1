# Script para registrar empleados en el sistema
# Uso: .\register-employee.ps1

param(
    [string]$ApiUrl = "http://localhost:5269",
    [switch]$Help
)

if ($Help) {
    Write-Host @"
Script de Registro de Empleados
================================

Uso: .\register-employee.ps1 [-ApiUrl <url>]

Parametros:
  -ApiUrl    URL base de la API (default: http://localhost:5000)
  -Help      Muestra esta ayuda

Ejemplos:
  .\register-employee.ps1
  .\register-employee.ps1 -ApiUrl "https://miapi.com"
"@
    exit 0
}

function Register-Employee {
    param(
        [string]$BaseUrl,
        [string]$FirstName,
        [string]$LastName,
        [string]$Email,
        [string]$Password,
        [string]$Area
    )

    $endpoint = "$BaseUrl/api/auth/register"
    
    $body = @{
        firstName = $FirstName
        lastName = $LastName
        email = $Email
        password = $Password
        area = $Area
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri $endpoint -Method Post -Body $body -ContentType "application/json"
        Write-Host "[OK] Empleado registrado exitosamente: $FirstName $LastName ($Email)" -ForegroundColor Green
        return $true
    }
    catch {
        $errorMessage = $_.Exception.Message
        if ($_.ErrorDetails.Message) {
            try {
                $errorJson = $_.ErrorDetails.Message | ConvertFrom-Json
                if ($errorJson.message) {
                    $errorMessage = $errorJson.message
                } elseif ($errorJson.title) {
                    $errorMessage = $errorJson.title
                } else {
                    $errorMessage = $_.ErrorDetails.Message
                }
            } catch {
                $errorMessage = $_.ErrorDetails.Message
            }
        }
        
        if ($errorMessage -like "*Ya existe*") {
            Write-Host "[SKIP] Ya existe: $Email" -ForegroundColor Yellow
            return $true
        } else {
            Write-Host "[ERROR] Error al registrar $Email : $errorMessage" -ForegroundColor Red
            return $false
        }
    }
}

# Banner
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Sistema de Registro de Empleados" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "API URL: $ApiUrl" -ForegroundColor Yellow
Write-Host ""

# Menu principal
while ($true) {
    Write-Host ""
    Write-Host "Opciones:" -ForegroundColor Cyan
    Write-Host "  1. Registrar un empleado"
    Write-Host "  2. Registrar multiples empleados desde archivo"
    Write-Host "  3. Registrar empleados de prueba"
    Write-Host "  4. Salir"
    Write-Host ""
    
    $option = Read-Host "Selecciona una opcion (1-4)"
    
    switch ($option) {
        "1" {
            # Registro individual
            Write-Host ""
            Write-Host "--- Registro Individual ---" -ForegroundColor Yellow
            $firstName = Read-Host "Nombre"
            $lastName = Read-Host "Apellido"
            $email = Read-Host "Email"
            $password = Read-Host "Contrasena" -AsSecureString
            $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))
            $area = Read-Host "Area (opcional)"
            
            Register-Employee -BaseUrl $ApiUrl -FirstName $firstName -LastName $lastName -Email $email -Password $passwordPlain -Area $area
        }
        
        "2" {
            # Registro desde archivo CSV
            Write-Host ""
            Write-Host "--- Registro desde Archivo CSV ---" -ForegroundColor Yellow
            Write-Host "El archivo CSV debe tener las columnas: FirstName,LastName,Email,Password,Area"
            Write-Host ""
            
            $csvPath = Read-Host "Ruta del archivo CSV"
            
            if (Test-Path $csvPath) {
                $employees = Import-Csv $csvPath
                $total = $employees.Count
                $success = 0
                $failed = 0
                
                Write-Host ""
                Write-Host "Procesando $total empleados..." -ForegroundColor Yellow
                Write-Host ""
                
                foreach ($emp in $employees) {
                    if (Register-Employee -BaseUrl $ApiUrl -FirstName $emp.FirstName -LastName $emp.LastName -Email $emp.Email -Password $emp.Password -Area $emp.Area) {
                        $success++
                    }
                    else {
                        $failed++
                    }
                }
                
                Write-Host ""
                Write-Host "Resumen:" -ForegroundColor Cyan
                Write-Host "  Total: $total" -ForegroundColor White
                Write-Host "  Exitosos: $success" -ForegroundColor Green
                Write-Host "  Fallidos: $failed" -ForegroundColor Red
            }
            else {
                Write-Host "Archivo no encontrado: $csvPath" -ForegroundColor Red
            }
        }
        
        "3" {
            # Empleados de prueba
            Write-Host ""
            Write-Host "--- Registrar Empleados de Prueba ---" -ForegroundColor Yellow
            Write-Host ""
            
            $testEmployees = @(
                @{ FirstName="Juan"; LastName="Perez"; Email="juan.perez@empresa.com"; Password="Password123!"; Area="IT" },
                @{ FirstName="Maria"; LastName="Garcia"; Email="maria.garcia@empresa.com"; Password="Password123!"; Area="RRHH" },
                @{ FirstName="Carlos"; LastName="Lopez"; Email="carlos.lopez@empresa.com"; Password="Password123!"; Area="Ventas" },
                @{ FirstName="Ana"; LastName="Martinez"; Email="ana.martinez@empresa.com"; Password="Password123!"; Area="Marketing" },
                @{ FirstName="Luis"; LastName="Rodriguez"; Email="luis.rodriguez@empresa.com"; Password="Password123!"; Area="Finanzas" }
            )
            
            Write-Host "Se registraran $($testEmployees.Count) empleados de prueba con contrasena 'Password123!'" -ForegroundColor Yellow
            $confirm = Read-Host "Continuar? (S/N)"
            
            if ($confirm -eq "S" -or $confirm -eq "s") {
                $success = 0
                $failed = 0
                
                foreach ($emp in $testEmployees) {
                    if (Register-Employee -BaseUrl $ApiUrl -FirstName $emp.FirstName -LastName $emp.LastName -Email $emp.Email -Password $emp.Password -Area $emp.Area) {
                        $success++
                    }
                    else {
                        $failed++
                    }
                }
                
                Write-Host ""
                Write-Host "Resumen:" -ForegroundColor Cyan
                Write-Host "  Exitosos: $success" -ForegroundColor Green
                Write-Host "  Fallidos: $failed" -ForegroundColor Red
            }
        }
        
        "4" {
            Write-Host ""
            Write-Host "Hasta luego!" -ForegroundColor Cyan
            Write-Host ""
            exit 0
        }
        
        default {
            Write-Host "Opcion invalida. Por favor selecciona 1-4." -ForegroundColor Red
        }
    }
}
