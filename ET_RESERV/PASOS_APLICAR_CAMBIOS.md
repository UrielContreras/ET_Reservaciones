# 🎯 Pasos para Aplicar los Cambios de Check-In/Check-Out

## ⚠️ IMPORTANTE: Aplicar en este orden

### 1️⃣ Detener el Servidor Backend (SI ESTÁ CORRIENDO)

```powershell
# Opción 1: Presiona Ctrl+C en la terminal donde corre el servidor

# Opción 2: Si está corriendo en segundo plano, ejecuta:
Stop-Process -Name "ComedorSalaApi" -Force
```

### 2️⃣ Aplicar la Migración de Base de Datos

```powershell
cd "C:\Users\Joshua.Diaz\Documents\Proyectos VS Code\React Native\Comedor\ET_Reservaciones\ET_RESERV\BackEnd\ComedorSalaApi"

dotnet ef database update
```

✅ **Deberías ver**: "Done." o mensaje de éxito

### 3️⃣ Compilar y Ejecutar el Backend

```powershell
# Asegúrate de estar en el directorio del backend
cd "C:\Users\Joshua.Diaz\Documents\Proyectos VS Code\React Native\Comedor\ET_Reservaciones\ET_RESERV\BackEnd\ComedorSalaApi"

dotnet build
dotnet run
```

✅ **Deberías ver**: El servidor corriendo en el puerto configurado

### 4️⃣ Compilar el Frontend

```powershell
cd "C:\Users\Joshua.Diaz\Documents\Proyectos VS Code\React Native\Comedor\ET_Reservaciones\ET_RESERV"

npm run build
```

✅ **Deberías ver**: Build completado sin errores

### 5️⃣ Generar el Código QR Fijo

1. Abre en tu navegador:
   ```
   C:\Users\Joshua.Diaz\Documents\Proyectos VS Code\React Native\Comedor\ET_Reservaciones\ET_RESERV\comedor-qr-code.html
   ```

2. Imprime el código QR usando el botón "🖨️ Imprimir Código QR"

3. Coloca el código impreso en un lugar visible del comedor

## 🧪 Probar la Funcionalidad

### Test de Check-In:

1. Abre la aplicación web (frontend)
2. Inicia sesión como empleado
3. Crea una reservación para hoy (si no tienes una)
4. Espera a que comience el horario de tu reservación
5. Verás un botón **"Check-In"** en la tarjeta de tu reservación
6. Click en "Check-In"
7. Permite el acceso a la cámara
8. Escanea el código QR impreso
9. ✅ Deberías ver: "Check-in exitoso"

### Test de Check-Out:

1. Después del check-in, la reservación cambia a estado "En Curso"
2. Ahora verás un botón **"Check-Out"**
3. Click en "Check-Out"
4. Escanea el mismo código QR
5. ✅ Deberías ver: "Check-out exitoso" con la duración de tu estancia

## 📊 Verificar en Base de Datos

```sql
SELECT 
    Id, 
    UserId, 
    Date, 
    Status,
    CheckInAt,
    CheckOutAt,
    DATEDIFF(MINUTE, CheckInAt, CheckOutAt) as MinutosEnComedor
FROM Reservations
WHERE CheckInAt IS NOT NULL
ORDER BY Date DESC, CheckInAt DESC;
```

## 🐛 Solución de Problemas

### Error: "The process cannot access the file"
```powershell
# El servidor sigue corriendo. Detenerlo:
Stop-Process -Name "ComedorSalaApi" -Force
```

### Error: "No puedo acceder a la cámara"
- Verifica permisos del navegador
- En Chrome: Configuración → Privacidad y seguridad → Configuración del sitio → Cámara
- Si usas HTTP (localhost), debería funcionar. En producción necesitas HTTPS.

### Error: "Código QR inválido"
- El código debe ser exactamente: `COMEDOR_CHECK_2024`
- Usa el HTML proporcionado para generar el código oficial

### Error: "No tienes una reservación activa para hoy"
- Asegúrate de tener una reservación creada para el día de hoy
- Verifica que la reservación esté en estado "Active"
- Verifica que el horario ya haya comenzado

## 🎉 ¡Listo!

Una vez completados estos pasos, el sistema de check-in/check-out estará funcionando completamente.

## 📞 Soporte

Si encuentras algún problema, verifica:
1. Los logs del backend (consola donde corre `dotnet run`)
2. La consola del navegador (F12 → Console)
3. Los errores de compilación del frontend
