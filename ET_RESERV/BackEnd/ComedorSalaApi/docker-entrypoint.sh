#!/bin/bash
set -e

echo "🚀 Iniciando API Comedor Sala..."

# Esperar a que SQL Server esté disponible
echo "⏳ Esperando a que SQL Server esté disponible..."
until /usr/bin/curl -s http://sqlserver:1433 > /dev/null 2>&1 || [ $? -eq 52 ]; do
  echo "   SQL Server no está listo - esperando..."
  sleep 2
done

echo "✅ SQL Server está disponible!"

# Esperar 5 segundos adicionales para asegurar que SQL está completamente listo
sleep 5

echo "🔄 Iniciando aplicación..."

# Ejecutar la aplicación
exec dotnet ComedorSalaApi.dll
