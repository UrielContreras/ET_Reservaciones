# Guía para Crear Nuevo App Service con Nombre Corto

## Paso 1: Crear el nuevo App Service en Azure

1. **Inicia sesión en Azure Portal**: https://portal.azure.com

2. **Crear App Service para el Backend (API)**
   - Haz clic en "Create a resource" → "Web App"
   - **Nombre sugerido**: `et-reservaciones-api`
     - URL resultante: `https://et-reservaciones-api.azurewebsites.net`
   - **Resource Group**: Usa el mismo que tienes o crea uno nuevo
   - **Runtime stack**: .NET 8 (LTS)
   - **Operating System**: Windows o Linux (el que estés usando)
   - **Region**: West US 2 (o la que prefieras)
   - **Pricing Plan**: El mismo que tienes actualmente
   - Haz clic en "Review + Create" → "Create"

3. **Crear App Service para el Frontend (Web)**
   - Haz clic en "Create a resource" → "Static Web App" o "Web App"
   - **Nombre sugerido**: `et-reservaciones`
     - URL resultante: `https://et-reservaciones.azurewebsites.net`
   - **Resource Group**: El mismo que el backend
   - **Runtime stack**: Node 18 LTS (o el que uses para Vite)
   - **Operating System**: Windows o Linux
   - **Region**: West US 2
   - Haz clic en "Review + Create" → "Create"

## Paso 2: Configurar el Backend

1. **Configurar Connection String y Variables de Entorno**
   - Ve al nuevo App Service del backend: `et-reservaciones-api`
   - En el menú izquierdo: "Configuration" → "Application settings"
   - Agrega estas configuraciones:

   ```
   Jwt__Key = EstaEsUnaClaveSecretaMuyLargaParaSerSegura
   Jwt__Issuer = tu-issuer
   Jwt__Audience = tu-audience
   AppSettings__TimeZoneId = Central Standard Time (Mexico)
   ```

2. **Configurar Connection String**
   - En la misma página de Configuration
   - Ve a "Connection strings"
   - Agrega:
   ```
   Name: DefaultConnection
   Value: Server=tcp:desarrollo-et.database.windows.net,1433;Initial Catalog=ComedorDB;Persist Security Info=False;User ID=adminComedor;Password=J.D.iaz117;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
   Type: SQLAzure
   ```
   - Haz clic en "Save"

3. **Configurar CORS**
   - En el App Service del backend: "CORS"
   - Agrega estos orígenes permitidos:
     ```
     https://et-reservaciones.azurewebsites.net
     http://localhost:5173
     http://localhost:5174
     ```
   - Haz clic en "Save"

## Paso 3: Desplegar el Backend

### Opción A: Desde VS Code (Recomendado)

1. Instala la extensión "Azure App Service" en VS Code
2. Haz clic derecho en la carpeta `BackEnd/ComedorSalaApi`
3. Selecciona "Deploy to Web App..."
4. Selecciona tu nueva app: `et-reservaciones-api`

### Opción B: Desde la Terminal

```powershell
cd BackEnd/ComedorSalaApi
dotnet publish -c Release -o ./publish
Compress-Archive -Path ./publish/* -DestinationPath ./publish.zip -Force

# Luego sube el archivo publish.zip manualmente desde el portal de Azure
# O usa Azure CLI:
az webapp deployment source config-zip --resource-group TU-RESOURCE-GROUP --name et-reservaciones-api --src ./publish.zip
```

## Paso 4: Actualizar la URL del Frontend

Una vez que el backend esté desplegado, actualiza el archivo de configuración del frontend.

**Ya lo hice por ti** - Revisa el archivo `apiConfig.ts` actualizado.

## Paso 5: Desplegar el Frontend

1. **Actualizar la configuración de build**
   ```powershell
   cd ET_RESERV
   npm run build
   ```

2. **Desplegar a Azure**
   - Desde VS Code:
     - Haz clic derecho en la carpeta `dist`
     - "Deploy to Static Website..." o "Deploy to Web App..."
     - Selecciona: `et-reservaciones`
   
   - O desde Azure Portal:
     - Ve a tu App Service `et-reservaciones`
     - "Deployment Center"
     - Configura desde "Local Git" o "GitHub"

## Paso 6: Verificar

1. **Probar el Backend**
   - Abre: `https://et-reservaciones-api.azurewebsites.net/api/test`
   - Deberías ver un mensaje de confirmación

2. **Probar el Frontend**
   - Abre: `https://et-reservaciones.azurewebsites.net`
   - Deberías ver tu aplicación funcionando

3. **Probar login**
   - Intenta iniciar sesión para verificar la comunicación entre frontend y backend

## Paso 7: (Opcional) Eliminar el App Service anterior

⚠️ **IMPORTANTE**: Solo elimina el antiguo después de verificar que todo funciona correctamente.

1. Ve al App Service antiguo: `comedorsalaapi-cpbbfna7e2h5gght`
2. Haz clic en "Delete"
3. Confirma la eliminación

---

## URLs Finales

- **Frontend**: `https://et-reservaciones.azurewebsites.net`
- **Backend API**: `https://et-reservaciones-api.azurewebsites.net`

¡Mucho más corto y fácil de recordar! 🎉
