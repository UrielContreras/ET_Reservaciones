-- Script para agregar la columna CheckOutAt a la tabla Reservations
-- Ejecutar este script directamente en Azure SQL Database

-- Verificar si la columna ya existe
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Reservations' 
    AND COLUMN_NAME = 'CheckOutAt'
)
BEGIN
    -- Agregar la columna CheckOutAt
    ALTER TABLE Reservations
    ADD CheckOutAt datetime2 NULL;
    
    PRINT 'Columna CheckOutAt agregada exitosamente';
END
ELSE
BEGIN
    PRINT 'La columna CheckOutAt ya existe';
END
GO
