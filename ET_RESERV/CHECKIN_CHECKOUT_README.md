# Sistema de Check-In/Check-Out con Código QR

## 📋 Resumen de Cambios

Se ha implementado un sistema de check-in y check-out usando un **código QR fijo** para el comedor.

## 🔧 Cambios Realizados

### Backend (C# .NET)

1. **Modelo `Reservation`** - Se agregó el campo:
   - `CheckOutAt` (DateTime?) - Timestamp del check-out

2. **DTOs** - Se agregó:
   - `QRCodeRequest` - Para recibir el código QR escaneado

3. **Endpoints nuevos** en `ReservationsController`:
   - `POST /api/reservations/check-in` - Registra la entrada al comedor
   - `POST /api/reservations/check-out` - Registra la salida del comedor

4. **Validaciones implementadas**:
   - El código QR debe ser exactamente: `COMEDOR_CHECK_2024`
   - Solo se puede hacer check-in si el usuario tiene una reservación activa para hoy
   - El horario de la reservación debe haber comenzado (no antes)
   - El horario no debe haber terminado
   - No se permite check-in duplicado
   - No se permite check-out sin check-in previo
   - No se permite check-out duplicado

### Frontend (React + TypeScript)

1. **Componente `QRScanner.tsx`**:
   - Usa la librería `html5-qrcode` para escanear códigos QR
   - Soporta dos modos: `checkin` y `checkout`
   - Maneja errores y mensajes de éxito
   - Se cierra automáticamente después de un escaneo exitoso

2. **Página `Reserv_home.tsx`**:
   - Botón **"Check-In"** en reservaciones con estado `Active`
   - Botón **"Check-Out"** en reservaciones con estado `InProgress`
   - Los botones abren el escáner de QR

3. **Dependencia instalada**:
   - `html5-qrcode` - Para escaneo de códigos QR desde la cámara

### Código QR Fijo

Se creó el archivo `comedor-qr-code.html` que:
- Genera el código QR con el texto: `COMEDOR_CHECK_2024`
- Se puede imprimir y colocar en el comedor
- Contiene instrucciones de uso
- **EL MISMO CÓDIGO QR sirve para check-in Y check-out**

## 🚀 Cómo Usar el Sistema

### Para Administradores:

1. **Generar el código QR**:
   ```bash
   # Abrir el archivo HTML en un navegador
   start comedor-qr-code.html
   ```
   O abre: `ET_RESERV/comedor-qr-code.html`

2. **Imprimir el código QR**:
   - Click en el botón "🖨️ Imprimir Código QR"
   - Colocar el código impreso en un lugar visible del comedor

3. **Aplicar la migración de base de datos**:
   ```bash
   cd BackEnd/ComedorSalaApi
   
   # Primero DETENER el servidor si está corriendo
   # Luego ejecutar:
   dotnet ef database update
   ```

### Para Empleados:

1. **Hacer Check-In**:
   - Ir a la página principal de reservaciones
   - Ver la reservación de hoy (debe estar en estado "Activa")
   - Click en el botón **"Check-In"**
   - Permitir acceso a la cámara
   - Escanear el código QR del comedor
   - Confirmar el mensaje de éxito

2. **Hacer Check-Out**:
   - Después de comer, en la misma página
   - La reservación ahora estará en estado "En Curso"
   - Click en el botón **"Check-Out"**
   - Escanear el mismo código QR del comedor
   - Confirmar el mensaje de éxito

## 📱 Flujo de Estados de Reservación

```
1. Active (Activa) → Usuario puede hacer Check-In
   ↓
2. InProgress (En Curso) → Usuario puede hacer Check-Out
   ↓
3. Expirada/Cancelada → No se pueden hacer operaciones
```

## 🔐 Seguridad

- Todas las operaciones requieren autenticación (token JWT)
- El código QR es validado en el backend
- Solo el usuario dueño de la reservación puede hacer check-in/out
- Se validan horarios y estados para prevenir abusos

## 🐛 Solución de Problemas

### "El servidor está corriendo y no puedo aplicar la migración"
```bash
# Detener todos los procesos de dotnet
Stop-Process -Name "ComedorSalaApi" -Force
# O simplemente cierra la terminal donde corre el servidor

# Luego aplica la migración
cd BackEnd/ComedorSalaApi
dotnet ef database update
```

### "No puedo escanear el código QR"
- Verifica que el navegador tenga permisos para usar la cámara
- Usa HTTPS en producción (requerido para acceso a cámara)
- Asegúrate de tener buena iluminación

### "Código QR inválido"
- Verifica que el código escaneado sea exactamente: `COMEDOR_CHECK_2024`
- Usa el HTML proporcionado para generar el código oficial

## 📊 Tracking de Datos

El sistema ahora guarda:
- `CheckInAt` - Cuándo el usuario entró al comedor
- `CheckOutAt` - Cuándo el usuario salió del comedor
- Permite calcular el tiempo de permanencia
- Útil para estadísticas y control de aforo

## 🎯 Próximas Mejoras Sugeridas

- Dashboard de estadísticas con tiempos promedio de permanencia
- Alertas si un usuario no hace check-out
- Historial detallado de check-ins/check-outs
- Reportes exportables en Excel/PDF
