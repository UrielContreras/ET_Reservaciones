import { useState, useCallback } from 'react';
import type { Reservation, AdminReservation } from '../types';
import * as reservationService from '../services/reservationService';

export type { Reservation, AdminReservation };

export const useReservations = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [myAdminReservations, setMyAdminReservations] = useState<AdminReservation[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [loadingAdminReservations, setLoadingAdminReservations] = useState(true);

  // Cargar todas las reservaciones para el calendario
  const loadReservations = useCallback(async () => {
    try {
      setLoadingReservations(true);
      const data = await reservationService.getAllReservations();
      setReservations(data);
    } catch (error) {
      console.error('Error al cargar reservaciones:', error);
    } finally {
      setLoadingReservations(false);
    }
  }, []);

  // Cargar las reservaciones del administrador actual
  const loadAdminReservations = useCallback(async () => {
    try {
      setLoadingAdminReservations(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('[ADMIN] No hay token');
        return;
      }

      // Verificar el rol del usuario
      try {
        const debugData = await reservationService.getDebugUserInfo();
        console.log('[ADMIN] Info de usuario:', debugData);
      } catch (err) {
        console.error('[ADMIN] Error al obtener info del usuario:', err);
      }

      console.log('[ADMIN] Llamando a /api/reservations/my-reservations...');
      const data = await reservationService.getMyReservations();
      
      console.log('[ADMIN] Reservaciones recibidas:', data);
      console.log('[ADMIN] Cantidad de reservaciones:', data.length);
      setMyAdminReservations(data);
    } catch (error: unknown) {
      console.error('[ADMIN] Error al cargar reservaciones:', error);
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: unknown } };
        console.error('[ADMIN] Status:', axiosError.response?.status);
        console.error('[ADMIN] Data:', axiosError.response?.data);
        if (axiosError.response?.status === 403) {
          console.error('[ADMIN] Error 403: No tienes permisos. Necesitas cerrar sesión y volver a iniciar sesión.');
        }
      }
    } finally {
      setLoadingAdminReservations(false);
    }
  }, []);

  // Cancelar una reservación del administrador
  const handleCancelAdminReservation = useCallback(async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta reservación?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await reservationService.cancelReservation(id);

      alert('Reservación cancelada exitosamente');
      loadAdminReservations();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error && 'response' in err 
        ? (err as { response?: { data?: unknown } }).response?.data 
        : 'Error al cancelar la reservación';
      alert(errorMessage);
      console.error('Error al cancelar reservación:', err);
    }
  }, [loadAdminReservations]);

  // Filtrar reservaciones para una fecha específica
  const getFilteredReservationsForDate = useCallback((
    dateString: string,
    searchTerm: string,
    statusFilter: string,
    typeFilter: string
  ) => {
    let comedorReservs = reservations.filter(r => r.date === dateString);

    // Aplicar filtro de búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      comedorReservs = comedorReservs.filter(r => 
        r.userName.toLowerCase().includes(searchLower) ||
        r.email.toLowerCase().includes(searchLower) ||
        (r.area?.toLowerCase() || '').includes(searchLower)
      );
    }

    // Aplicar filtro de estado
    if (statusFilter !== 'all') {
      comedorReservs = comedorReservs.filter(r => r.status === statusFilter);
    }

    // Aplicar filtro de tipo
    if (typeFilter === 'sala') {
      comedorReservs = [];
    }

    return comedorReservs;
  }, [reservations]);

  return {
    // Estado
    reservations,
    myAdminReservations,
    loadingReservations,
    loadingAdminReservations,
    
    // Funciones
    loadReservations,
    loadAdminReservations,
    handleCancelAdminReservation,
    getFilteredReservationsForDate
  };
};
