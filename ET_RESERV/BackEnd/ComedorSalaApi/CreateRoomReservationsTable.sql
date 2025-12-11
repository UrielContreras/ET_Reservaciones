-- Script para crear la tabla RoomReservations manualmente
-- Ejecuta este script en SQL Server Management Studio o Azure Data Studio

USE [comedor_reservaciones_db];
GO

-- Verificar si la tabla ya existe
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RoomReservations')
BEGIN
    CREATE TABLE [dbo].[RoomReservations](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [UserId] [int] NOT NULL,
        [Date] [date] NOT NULL,
        [StartTime] [time](7) NOT NULL,
        [EndTime] [time](7) NOT NULL,
        [Status] [int] NOT NULL,
        [CreatedAt] [datetime2](7) NOT NULL,
        [CheckInAt] [datetime2](7) NULL,
        CONSTRAINT [PK_RoomReservations] PRIMARY KEY CLUSTERED ([Id] ASC)
    );

    CREATE NONCLUSTERED INDEX [IX_RoomReservations_UserId] ON [dbo].[RoomReservations]
    (
        [UserId] ASC
    );

    ALTER TABLE [dbo].[RoomReservations] WITH CHECK 
    ADD CONSTRAINT [FK_RoomReservations_Users_UserId] 
    FOREIGN KEY([UserId]) REFERENCES [dbo].[Users] ([Id]);

    ALTER TABLE [dbo].[RoomReservations] CHECK CONSTRAINT [FK_RoomReservations_Users_UserId];

    PRINT 'Tabla RoomReservations creada exitosamente';
END
ELSE
BEGIN
    PRINT 'La tabla RoomReservations ya existe';
END
GO

-- Registrar la migración en el historial
IF NOT EXISTS (SELECT * FROM [__EFMigrationsHistory] WHERE MigrationId = '20251210134700_AddRoomReservationsTable')
BEGIN
    INSERT INTO [__EFMigrationsHistory] (MigrationId, ProductVersion)
    VALUES ('20251210134700_AddRoomReservationsTable', '9.0.0');
    PRINT 'Migración registrada en el historial';
END
GO
