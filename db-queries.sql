-- ============================================
-- CONSULTAS ÚTILES PARA LA BASE DE DATOS
-- ============================================

-- 1. VER TODOS LOS USUARIOS
SELECT Id, FirstName, LastName, Email, Role, Area, IsActive, CreatedAt
FROM Users
ORDER BY CreatedAt DESC;

-- 2. CAMBIAR ROL DE UN USUARIO (Employee = 0, HR = 1)
-- Cambiar a Administrador (HR):
UPDATE Users 
SET Role = 1 
WHERE Email = 'correo@ejemplo.com';

-- Cambiar a Empleado:
UPDATE Users 
SET Role = 0 
WHERE Email = 'correo@ejemplo.com';

-- 3. ACTIVAR/DESACTIVAR USUARIO
-- Desactivar:
UPDATE Users 
SET IsActive = 0 
WHERE Email = 'correo@ejemplo.com';

-- Activar:
UPDATE Users 
SET IsActive = 1 
WHERE Email = 'correo@ejemplo.com';

-- 4. VER TODAS LAS RESERVACIONES
SELECT r.Id, r.ReservationDate, r.UserId, 
       u.FirstName + ' ' + u.LastName AS UserName,
       r.Status, r.CreatedAt
FROM Reservations r
INNER JOIN Users u ON r.UserId = u.Id
ORDER BY r.ReservationDate DESC;

-- 5. VER RESERVACIONES DE SALAS
SELECT rr.Id, rr.RoomName, rr.ReservationDate, 
       rr.StartTime, rr.EndTime,
       u.FirstName + ' ' + u.LastName AS UserName,
       rr.Status
FROM RoomReservations rr
INNER JOIN Users u ON rr.UserId = u.Id
ORDER BY rr.ReservationDate DESC;

-- 6. ELIMINAR UN USUARIO (¡CUIDADO!)
DELETE FROM Users WHERE Email = 'correo@ejemplo.com';

-- 7. RESETEAR CONTRASEÑA MANUALMENTE
-- Primero genera el hash con el API o usa una contraseña temporal
UPDATE Users 
SET PasswordHash = 'hash_generado_por_api' 
WHERE Email = 'correo@ejemplo.com';

-- 8. CONTAR USUARIOS POR ROL
SELECT 
    CASE Role 
        WHEN 0 THEN 'Empleado'
        WHEN 1 THEN 'Administrador'
    END AS RoleName,
    COUNT(*) AS Total
FROM Users
GROUP BY Role;

-- 9. VER SLOTS DE TIEMPO DISPONIBLES
SELECT * FROM TimeSlots ORDER BY StartTime;

-- 10. BUSCAR USUARIO POR NOMBRE
SELECT Id, FirstName, LastName, Email, Role, Area
FROM Users
WHERE FirstName LIKE '%Juan%' OR LastName LIKE '%Perez%';
