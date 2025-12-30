import { useState } from 'react';

/**
 * Custom Hook para gestionar filtros de reservaciones en el panel de administración
 * 
 * Responsabilidades:
 * - Gestionar término de búsqueda
 * - Filtrar por estado (Active, Cancelled, etc.)
 * - Filtrar por tipo (comedor, sala)
 * - Gestionar vista (todas vs mis reservaciones)
 * - Gestionar calendario (fecha actual, fecha seleccionada)
 */
export const useReservationFilters = () => {
  // Estados de filtrado de búsqueda
  const [reservationSearchTerm, setReservationSearchTerm] = useState('');
  const [reservationStatusFilter, setReservationStatusFilter] = useState<'all' | 'Active' | 'Cancelled' | 'Expired' | 'InProgress' | 'Completed'>('all');
  const [reservationTypeFilter, setReservationTypeFilter] = useState<'all' | 'comedor' | 'sala'>('all');
  
  // Estado de vista de reservaciones (todas o solo del admin)
  const [reservationFilter, setReservationFilter] = useState<'all' | 'admin'>('all');
  
  // Estados del calendario
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  /**
   * Limpiar todos los filtros y volver a valores por defecto
   */
  const clearFilters = () => {
    setReservationSearchTerm('');
    setReservationStatusFilter('all');
    setReservationTypeFilter('all');
  };

  /**
   * Verificar si hay algún filtro activo
   */
  const hasActiveFilters = () => {
    return (
      reservationSearchTerm !== '' ||
      reservationStatusFilter !== 'all' ||
      reservationTypeFilter !== 'all'
    );
  };

  /**
   * Navegar al mes anterior en el calendario
   */
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  /**
   * Navegar al mes siguiente en el calendario
   */
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  /**
   * Seleccionar o deseleccionar una fecha en el calendario
   */
  const toggleDateSelection = (dateString: string) => {
    setSelectedDate(selectedDate === dateString ? null : dateString);
  };

  return {
    // Estados de búsqueda y filtros
    reservationSearchTerm,
    setReservationSearchTerm,
    reservationStatusFilter,
    setReservationStatusFilter,
    reservationTypeFilter,
    setReservationTypeFilter,
    
    // Vista de reservaciones
    reservationFilter,
    setReservationFilter,
    
    // Calendario
    currentDate,
    setCurrentDate,
    selectedDate,
    setSelectedDate,
    
    // Funciones helper
    clearFilters,
    hasActiveFilters,
    goToPreviousMonth,
    goToNextMonth,
    toggleDateSelection
  };
};
