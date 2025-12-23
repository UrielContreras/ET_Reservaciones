-- Agregar columna MeetingName a la tabla RoomReservations
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[RoomReservations]') AND name = 'MeetingName')
BEGIN
    ALTER TABLE RoomReservations ADD MeetingName NVARCHAR(MAX) NULL;
    PRINT 'Columna MeetingName agregada exitosamente';
END
ELSE
BEGIN
    PRINT 'La columna MeetingName ya existe';
END
GO
