# Configuración de Zona Horaria para Azure App Service

## Problema
Azure App Service usa UTC por defecto, lo que causa que las validaciones de horario de reservaciones fallen en producción cuando funcionan correctamente en local.

## Solución Implementada

### 1. Cambios en el Código
- Se agregó `TimeZoneInfo` en `Program.cs`, `ReservationsController.cs` y `ReservationExpirationService.cs`
- Se creó el método `GetMexicoTime()` que convierte UTC a hora de México
- Se actualizaron todos los usos de `DateTime.Now` a `GetMexicoTime()`

### 2. Configuración en Azure App Service

**IMPORTANTE**: Después de publicar el código actualizado, debes configurar la zona horaria en el Azure Portal:

#### Opción A: Configuración de Aplicación (Recomendado)
1. Ve a tu App Service en Azure Portal
2. En el menú lateral, selecciona **Configuración** > **Configuración de la aplicación**
3. En la sección "Configuración de la aplicación", haz clic en **Nueva configuración de la aplicación**
4. Agrega:
   - **Nombre**: `WEBSITE_TIME_ZONE`
   - **Valor**: `Central Standard Time (Mexico)`
5. Haz clic en **Guardar**
6. Reinicia la aplicación

#### Opción B: Variable de Entorno
Alternativamente, puedes configurarlo mediante Azure CLI:
```bash
az webapp config appsettings set --name TU_APP_SERVICE_NAME --resource-group TU_RESOURCE_GROUP --settings WEBSITE_TIME_ZONE="Central Standard Time (Mexico)"
```

### 3. Zonas Horarias Válidas para México
- `Central Standard Time (Mexico)` - Zona Centro (Ciudad de México, incluye horario de verano)
- `Mountain Standard Time (Mexico)` - Zona Montaña (Chihuahua, Sonora)
- `Pacific Standard Time (Mexico)` - Zona Pacífico (Baja California)

### 4. Verificación
Después de configurar:
1. Reinicia el App Service
2. Revisa los logs para confirmar que la hora esté correcta
3. Prueba crear una reservación
4. Los logs deben mostrar: `[TIMEZONE] Hora actual en México: YYYY-MM-DD HH:mm:ss`

### 5. Referencias
- [Azure App Service Time Zones](https://learn.microsoft.com/en-us/azure/app-service/configure-common#time-zone)
- [Windows Time Zone IDs](https://docs.microsoft.com/en-us/windows-hardware/manufacture/desktop/default-time-zones)
