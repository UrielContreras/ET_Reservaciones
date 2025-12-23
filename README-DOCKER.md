# 🐳 Servidor Comedor - Configuración Docker + ngrok

Este proyecto está configurado para ejecutarse completamente en Docker con exposición mediante ngrok.

## 📋 Prerequisitos

1. **Docker Desktop** instalado y corriendo
   - Descargar: https://www.docker.com/products/docker-desktop/

2. **ngrok** instalado
   - Descargar: https://ngrok.com/download
   - Autenticar: `ngrok config add-authtoken TU_TOKEN`

3. **PowerShell** (viene con Windows)

## 🚀 Inicio Rápido

### Primera vez (Build completo)

```powershell
# Iniciar servidor
.\start-server.ps1
```

Esto hará:
1. ✅ Verificar Docker
2. 🏗️ Construir imágenes (SQL Server + API)
3. 🚀 Iniciar contenedores
4. 🔄 Aplicar migraciones de base de datos
5. 🌐 Iniciar túnel ngrok

### Usos subsecuentes

```powershell
# Iniciar (usa imágenes ya construidas)
.\start-server.ps1

# Detener
.\stop-server.ps1
```

## 📊 Servicios Disponibles

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| SQL Server | `localhost:1433` | User: `sa`<br>Pass: `YourStrong@Passw0rd123` |
| API (Local) | `http://localhost:5001` | - |
| API (Pública) | Ver ngrok dashboard | - |
| ngrok Dashboard | `http://localhost:4040` | - |

## 🔧 Configuración Frontend

Después de iniciar el servidor:

1. Abre `http://localhost:4040`
2. Copia la URL HTTPS (ej: `https://abc123.ngrok-free.app`)
3. Actualiza `ET_RESERV/src/apiConfig.ts`:

```typescript
const API_URL = 'https://abc123.ngrok-free.app';
export default API_URL;
```

## 📝 Comandos Útiles

### Docker

```powershell
# Ver logs de la API
docker logs comedor-api -f

# Ver logs de SQL Server
docker logs comedordb-sql -f

# Reiniciar solo la API
docker-compose restart api

# Entrar al contenedor de la API
docker exec -it comedor-api bash

# Ejecutar migraciones manualmente
docker exec comedor-api dotnet ef database update

# Ver estado de contenedores
docker-compose ps

# Reconstruir todo desde cero
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Base de Datos

```powershell
# Conectar a SQL Server desde tu máquina
# Usar SQL Server Management Studio o Azure Data Studio
# Server: localhost,1433
# User: sa
# Password: YourStrong@Passw0rd123

# O usar sqlcmd
docker exec -it comedordb-sql /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P YourStrong@Passw0rd123
```

## 🔍 Solución de Problemas

### Docker no inicia

```powershell
# Verificar que Docker Desktop está corriendo
docker info

# Si no funciona, reinicia Docker Desktop
```

### Errores de migración

```powershell
# Aplicar migraciones manualmente
docker exec comedor-api dotnet ef database update

# Ver logs de SQL Server
docker logs comedordb-sql -f
```

### API no responde

```powershell
# Ver logs
docker logs comedor-api -f

# Reiniciar API
docker-compose restart api

# Verificar que SQL Server está listo
docker logs comedordb-sql | findstr "Server is listening"
```

### Puerto 5001 ya está en uso

```powershell
# Ver qué está usando el puerto
netstat -ano | findstr :5001

# Detener proceso (reemplaza PID)
Stop-Process -Id PID -Force

# O cambiar puerto en docker-compose.yml
# Cambiar "5001:5001" a "5002:5001"
```

### ngrok no inicia

```powershell
# Verificar autenticación
ngrok config check

# Re-autenticar
ngrok config add-authtoken TU_TOKEN
```

## 📁 Estructura de Archivos Docker

```
ET_Reservaciones/
├── docker-compose.yml          # Orquestación de servicios
├── start-server.ps1            # Script de inicio
├── stop-server.ps1             # Script de parada
├── .env.example                # Variables de entorno
└── ET_RESERV/
    └── BackEnd/
        └── ComedorSalaApi/
            ├── Dockerfile              # Imagen de la API
            ├── docker-entrypoint.sh    # Script de inicio del contenedor
            ├── .dockerignore           # Archivos excluidos
            └── appsettings.Production.json
```

## 🔒 Seguridad

**⚠️ IMPORTANTE para Producción:**

1. Cambiar password de SA en `docker-compose.yml`
2. Cambiar JWT_KEY en `appsettings.Production.json`
3. Usar variables de entorno en lugar de hardcodear valores
4. Configurar firewall de Windows
5. Usar HTTPS en la API (certificados SSL)

## 🌐 Acceso Remoto

### Configurar CORS para ngrok

El CORS ya está configurado para aceptar cualquier origen en modo Production. Si necesitas restringirlo, edita `Program.cs`.

### URL fija de ngrok (Plan Pago)

Si tienes plan de pago de ngrok, puedes usar dominio fijo:

```powershell
ngrok http 5001 --domain=tu-dominio.ngrok-free.app
```

## 💾 Persistencia de Datos

Los datos de SQL Server se guardan en un volumen Docker llamado `sqlserver-data`. Esto significa que:

- ✅ Los datos persisten aunque detengas los contenedores
- ✅ Puedes reiniciar sin perder información
- ⚠️ Si ejecutas `docker-compose down -v`, perderás todos los datos

```powershell
# Ver volúmenes
docker volume ls

# Ver detalles del volumen
docker volume inspect et_reservaciones_sqlserver-data

# Backup del volumen
docker run --rm -v et_reservaciones_sqlserver-data:/data -v ${PWD}:/backup ubuntu tar czf /backup/backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').tar.gz /data
```

## 🎯 Próximos Pasos

- [ ] Configurar frontend para usar URL de ngrok
- [ ] Probar endpoints de la API
- [ ] Configurar Task Scheduler para inicio/apagado automático
- [ ] Configurar backup automático de base de datos
- [ ] Implementar monitoreo de logs
