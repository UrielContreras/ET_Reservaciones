# SOLUCIÓN: Errores 404 en Producción

## Problema Identificado
El API en Azure está devolviendo 404 en todos los endpoints, incluyendo `/api/reservations/my-reservations`. El login funciona porque probablemente está en caché o usando una versión antigua.

## Diagnóstico Realizado
- ✅ Frontend compilado correctamente con la URL correcta del API
- ✅ Migraciones ejecutadas sin error
- ❌ API en Azure NO responde (404 en todos los endpoints)
- ❌ Problema: **El API no está desplegado correctamente en Azure**

---

## SOLUCIÓN 1: Redesplegar el API en Azure

### Paso 1: Compilar y Publicar Localmente
```powershell
cd "ET_RESERV\BackEnd\ComedorSalaApi"
dotnet clean
dotnet build -c Release
dotnet publish -c Release -o .\publish
```

### Paso 2: Desplegar a Azure usando VS Code o Azure CLI

#### Opción A: Usando Azure App Service Extension (VS Code)
1. Instalar extensión: "Azure App Service"
2. Click derecho en la carpeta `publish`
3. Seleccionar "Deploy to Web App..."
4. Elegir tu App Service: `comedorsalaapi-cpbbfna7e2h5gght`

#### Opción B: Usando Azure CLI
```powershell
# Navegar a la carpeta publish
cd publish

# Crear archivo ZIP
Compress-Archive -Path .\* -DestinationPath ..\api-deploy.zip -Force

# Desplegar a Azure
az webapp deployment source config-zip `
  --resource-group "tu-resource-group" `
  --name "comedorsalaapi-cpbbfna7e2h5gght" `
  --src "../api-deploy.zip"
```

#### Opción C: Usando Visual Studio (Publish Profile)
1. Click derecho en el proyecto `ComedorSalaApi`
2. Seleccionar "Publish..."
3. Usar el perfil existente de Azure
4. Click en "Publish"

---

## SOLUCIÓN 2: Verificar Configuración de Azure App Service

### Verificar en el Portal de Azure:
1. Ve a: https://portal.azure.com
2. Busca tu App Service: `comedorsalaapi-cpbbfna7e2h5gght`
3. En el menú lateral, ir a "Configuration"
4. Verificar:
   - ✅ `ASPNETCORE_ENVIRONMENT` = `Production` o no establecido
   - ✅ `WEBSITE_RUN_FROM_PACKAGE` = `0` o no establecido

### Verificar Stack Settings:
1. En el App Service, ir a "Configuration" → "General settings"
2. Verificar:
   - ✅ Stack: `.NET`
   - ✅ .NET Version: `9.0` (o la versión que usas)
   - ✅ Platform: `64 Bit`

---

## SOLUCIÓN 3: Verificar Logs de Azure

### Ver logs en tiempo real:
```powershell
# Instalar Azure CLI si no lo tienes
# winget install Microsoft.AzureCLI

# Login a Azure
az login

# Ver logs en vivo
az webapp log tail --name comedorsalaapi-cpbbfna7e2h5gght --resource-group tu-resource-group
```

### Ver logs en el Portal:
1. En tu App Service, ir a "Log stream"
2. Ver errores de inicio de la aplicación

---

## SOLUCIÓN 4: Verificar Program.cs para Producción

Asegúrate de que `Program.cs` esté configurado correctamente:

```csharp
// En Program.cs, después de crear la app:

// NO uses app.Environment.IsDevelopment() para Swagger en producción
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Asegúrate de tener esto:
app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers(); // ← IMPORTANTE: Esto registra los controladores

app.Run();
```

---

## VERIFICACIÓN POST-DESPLIEGUE

### Test 1: Verificar que el API responda
```powershell
# Debería devolver 200 o 401 (no 404)
Invoke-WebRequest -Uri "https://comedorsalaapi-cpbbfna7e2h5gght.westus2-01.azurewebsites.net/api/test/dbconnection"
```

### Test 2: Verificar endpoints de Reservations
```powershell
# Debería devolver 401 (requiere auth) no 404
Invoke-WebRequest -Uri "https://comedorsalaapi-cpbbfna7e2h5gght.westus2-01.azurewebsites.net/api/reservations/my-reservations"
```

### Test 3: Desde el Frontend
1. Desplegar el nuevo build del frontend a Azure
2. Hacer login
3. Ir a la vista de admin
4. Verificar que las reservaciones cargen correctamente

---

## REDESPLEGAR EL FRONTEND

Después de verificar que el API funciona:

```powershell
# Desde la carpeta ET_RESERV
npm run build

# Desplegar la carpeta dist a Azure Web App
# Usar la extensión "Azure App Service" en VS Code
# O usar Azure CLI:
cd dist
Compress-Archive -Path .\* -DestinationPath ..\frontend-deploy.zip -Force
az webapp deployment source config-zip `
  --resource-group "tu-resource-group" `
  --name "comedorsalaweb-b8f3hwcuhjhvh3bt" `
  --src "../frontend-deploy.zip"
```

---

## CHECKLIST FINAL

- [ ] API compilado y publicado localmente sin errores
- [ ] API desplegado en Azure App Service
- [ ] Logs de Azure muestran que la app inició correctamente
- [ ] Endpoint `/api/test/dbconnection` responde (no 404)
- [ ] Endpoints de `/api/reservations` responden con 401 (no 404)
- [ ] Frontend recompilado con `npm run build`
- [ ] Frontend desplegado en Azure
- [ ] Login funciona correctamente
- [ ] Vista de admin carga reservaciones sin errores 404

---

## NOTAS IMPORTANTES

1. **Los errores 404 indican que los controladores no están registrados** - El problema está en el despliegue del API, NO en el código

2. **El login funciona porque usa un endpoint diferente** - `/api/auth/login` probablemente está funcionando

3. **Después de redesplegar, espera 1-2 minutos** - Azure tarda un poco en reiniciar la aplicación

4. **Si sigues teniendo problemas** - Revisa los logs de Azure, probablemente hay un error de inicio de la aplicación

---

## ¿Necesitas Ayuda?

Si después de seguir estos pasos sigues teniendo problemas:
1. Revisa los logs de Azure (paso 3)
2. Verifica que el `web.config` se generó correctamente en la carpeta publish
3. Asegúrate de que las dependencias de .NET 9 estén instaladas en Azure
