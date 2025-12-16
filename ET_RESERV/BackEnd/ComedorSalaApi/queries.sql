-- Base de datos local: ComedorDB_Dev
-- Consultas de ejemplo

-- Ver todos los usuarios
SELECT * FROM Users;

-- Ver todas las reservaciones
SELECT * FROM Reservations;

-- Ver todos los TimeSlots
SELECT * FROM TimeSlots;

-- Contar usuarios por rol
SELECT Role, COUNT(*) as Total 
FROM Users 
GROUP BY Role;
