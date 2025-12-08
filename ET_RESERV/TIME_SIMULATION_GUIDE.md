# 🕐 Guía de Simulación de Tiempo para Pruebas

## 📋 Descripción

Se implementó un sistema de **simulación de tiempo** que permite establecer cualquier hora del día sin cambiar la hora del sistema. Perfecto para probar reservaciones, check-ins, y validaciones de horarios.

---

## 🚀 Cómo Usar

### Método 1: Atajos Rápidos (Recomendado)

Usa estos endpoints para establecer horas comunes:

```bash
# Establecer las 09:30 (antes de que abran las reservaciones)
curl -X POST http://localhost:5000/api/timesimulation/quick/before10am

# Establecer las 10:00 (justo cuando abren las reservaciones)
curl -X POST http://localhost:5000/api/timesimulation/quick/10am

# Establecer las 13:00 (primer horario de comida)
curl -X POST http://localhost:5000/api/timesimulation/quick/lunch1

# Establecer las 14:00 (segundo horario de comida)
curl -X POST http://localhost:5000/api/timesimulation/quick/lunch2

# Establecer las 15:00 (tercer horario de comida)
curl -X POST http://localhost:5000/api/timesimulation/quick/lunch3

# Establecer las 16:30 (después del horario de comida)
curl -X POST http://localhost:5000/api/timesimulation/quick/afterlunch
```

### Método 2: Hora Personalizada

Establece cualquier hora específica:

```bash
# Ejemplo: Establecer las 14:00
curl -X POST http://localhost:5000/api/timesimulation/set \
  -H "Content-Type: application/json" \
  -d '{"hour": 14, "minute": 0}'

# Ejemplo: Establecer las 13:45
curl -X POST http://localhost:5000/api/timesimulation/set \
  -H "Content-Type: application/json" \
  -d '{"hour": 13, "minute": 45}'
```

### Método 3: Desde PowerShell (Windows)

```powershell
# Establecer las 14:00
Invoke-RestMethod -Uri "http://localhost:5000/api/timesimulation/set" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"hour": 14, "minute": 0}'

# O usar atajos rápidos
Invoke-RestMethod -Uri "http://localhost:5000/api/timesimulation/quick/lunch2" -Method POST
```

### Ver Estado Actual

```bash
# Ver la hora simulada actual
curl http://localhost:5000/api/timesimulation/status
```

Respuesta:
```json
{
  "isSimulating": true,
  "realTime": "08:45:23",
  "currentTime": "14:00:00",
  "offset": "05:14:37"
}
```

### Desactivar Simulación

```bash
# Volver a usar la hora real del sistema
curl -X POST http://localhost:5000/api/timesimulation/clear
```

---

## 🧪 Casos de Uso para Pruebas

### 1. Probar Restricción de Horario (antes de las 10 AM)

```bash
# Establecer las 09:30
curl -X POST http://localhost:5000/api/timesimulation/quick/before10am

# Intentar crear una reservación
# Resultado esperado: Error "Las reservaciones solo pueden hacerse a partir de las 10:00 AM"
```

### 2. Probar Creación de Reservaciones

```bash
# Establecer las 10:00 o después
curl -X POST http://localhost:5000/api/timesimulation/quick/10am

# Crear reservación
# Resultado esperado: Reservación creada exitosamente
```

### 3. Probar Check-In

```bash
# Establecer la hora del horario de comida (ej: 13:00)
curl -X POST http://localhost:5000/api/timesimulation/quick/lunch1

# Hacer check-in con el código QR
# Resultado esperado: Check-in exitoso
```

### 4. Probar Expiración de Reservaciones

```bash
# Crear reservación para las 13:00-14:00

# Establecer las 14:01 (después del horario)
curl -X POST http://localhost:5000/api/timesimulation/set \
  -H "Content-Type: application/json" \
  -d '{"hour": 14, "minute": 1}'

# Verificar que la reservación expira automáticamente
```

### 5. Probar Check-In antes de tiempo

```bash
# Crear reservación para las 14:00-15:00

# Establecer las 13:50 (antes del horario)
curl -X POST http://localhost:5000/api/timesimulation/set \
  -H "Content-Type: application/json" \
  -d '{"hour": 13, "minute": 50}'

# Intentar check-in
# Resultado esperado: Error "Tu reservación aún no comienza"
```

---

## 📊 Flujo de Prueba Completo

```bash
# 1. Establecer las 10:00 AM
curl -X POST http://localhost:5000/api/timesimulation/quick/10am

# 2. Crear reservación para el horario de 14:00-15:00
# (Usar la interfaz web o API)

# 3. Avanzar el tiempo a las 14:00
curl -X POST http://localhost:5000/api/timesimulation/quick/lunch2

# 4. Hacer check-in con código QR
# (Usar la interfaz web)

# 5. Avanzar el tiempo a las 14:30
curl -X POST http://localhost:5000/api/timesimulation/set \
  -H "Content-Type: application/json" \
  -d '{"hour": 14, "minute": 30}'

# 6. Hacer check-out con código QR
# (Usar la interfaz web)

# 7. Volver a hora real
curl -X POST http://localhost:5000/api/timesimulation/clear
```

---

## 🎯 Endpoints Disponibles

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/timesimulation/set` | POST | Establece hora personalizada |
| `/api/timesimulation/clear` | POST | Desactiva simulación |
| `/api/timesimulation/status` | GET | Ver estado actual |
| `/api/timesimulation/quick/{preset}` | POST | Usar atajos rápidos |

### Presets Disponibles:
- `before10am` → 09:30
- `10am` → 10:00
- `lunch1` → 13:00
- `lunch2` → 14:00
- `lunch3` → 15:00
- `afterlunch` → 16:30

---

## ⚠️ Notas Importantes

1. **Solo para desarrollo**: Esta funcionalidad es para pruebas locales
2. **Persistente durante la sesión**: La hora simulada permanece hasta que cierres el servidor o la limpies
3. **Afecta todas las operaciones**: Check-ins, reservaciones, expiraciones, etc.
4. **No afecta la hora del sistema**: Solo simula dentro de la aplicación
5. **Logs**: Verás en la consola del servidor cuando se establece/limpia una simulación

---

## 🐛 Solución de Problemas

### La simulación no funciona
```bash
# Verificar el estado
curl http://localhost:5000/api/timesimulation/status

# Reiniciar el servidor si es necesario
```

### Ver en consola qué hora está usando el sistema
- Revisa los logs del servidor, verás mensajes como:
  ```
  [TIME_SIMULATION] ⏰ Hora real: 08:45:23
  [TIME_SIMULATION] 🎭 Hora simulada: 14:00:00
  ```

---

## 🎉 ¡Prueba Todo sin Esperar!

Ahora puedes probar todo el flujo de reservaciones en minutos sin tener que esperar a las horas reales. 🚀
