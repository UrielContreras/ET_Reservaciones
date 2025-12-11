@echo off
echo Ejecutando migracion de base de datos...
timeout /t 3 /nobreak > nul
curl -X POST http://localhost:5269/api/migration/create-table-sql
echo.
echo.
echo Presiona cualquier tecla para salir...
pause > nul
