//Funciones de utilidad generales de Home_Admin (panel de control de administrador)

import type { AdminReservation, RoomReservation } from '../types';

// Función para generar colores basados en hash (estáticos por ID)
export const getColorFromId = (id: number): string => {
  const colors = [
    '#667eea', '#764ba2', '#f093fb', '#4facfe',
    '#43e97b', '#fa709a', '#fee140', '#30cfd0',
    '#a8edea', '#ff6a88', '#feca57', '#48dbfb',
    '#ff9ff3', '#54a0ff', '#00d2d3', '#1dd1a1',
    '#ee5a6f', '#c44569', '#f8b500', '#6c5ce7',
    '#fd79a8', '#fdcb6e', '#e17055', '#00b894',
    '#0984e3', '#6c5ce7', '#a29bfe', '#fd79a8'
  ];
  
  // Usar el ID como índice para seleccionar un color consistente
  return colors[id % colors.length];
};

// Función para formatear fecha sin problemas de zona horaria
export const formatDate = (dateString: string): string => {
    const [year, month, day] = dateString.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString('es-MX');
};

// Función para obtener días del mes
export const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
};

// Función para obtener reservaciones de un día específico
export const getReservationsForDate = (
    dateString: string,
    myAdminReservations: AdminReservation[],
    myAdminRoomReservations: RoomReservation[]
) => {
    const comedorReservs = myAdminReservations.filter((r: AdminReservation) => r.date === dateString);
    const salaReservs = myAdminRoomReservations.filter((r: RoomReservation) => r.date === dateString);
    return { comedor: comedorReservs, sala: salaReservs };
};

// Función para formatear fecha a YYYY-MM-DD
export const formatDateToString = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

// Función para obtener la fecha de hoy en formato YYYY-MM-DD
export const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};