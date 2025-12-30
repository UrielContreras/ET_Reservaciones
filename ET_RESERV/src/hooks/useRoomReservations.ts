import { useState, useCallback } from 'react';
import type { RoomReservation } from '../types';
import * as roomReservationService from '../services/roomReservationService';

export type { RoomReservation };

export const useRoomReservations = () => {
  const [roomReservations, setRoomReservations] = useState<RoomReservation[]>([]);
  const [myAdminRoomReservations, setMyAdminRoomReservations] = useState<RoomReservation[]>([]);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [reservationToReschedule, setReservationToReschedule] = useState<RoomReservation | null>(null);
  
  // Estados para reprogramación
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleStartTime, setRescheduleStartTime] = useState('');
  const [rescheduleEndTime, setRescheduleEndTime] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Cargar todas las reservaciones de sala para el calendario
  const loadRoomReservations = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const data = await roomReservationService.getAllRoomReservations();
      setRoomReservations(data);
    } catch (error) {
      console.error('Error al cargar reservaciones de sala:', error);
    }
  }, []);

  // Cargar las reservaciones de sala del administrador actual
  const loadAdminRoomReservations = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const data = await roomReservationService.getMyRoomReservations();
      console.log('[ADMIN] Reservaciones de sala recibidas:', data);
      setMyAdminRoomReservations(data);
    } catch (roomErr) {
      console.error('[ADMIN] Error al cargar reservaciones de sala:', roomErr);
    }
  }, []);

  // Cancelar una reservación de sala del administrador (también recarga reservaciones de comedor)
  const handleCancelAdminRoomReservation = useCallback(async (id: number, reloadComedorReservations: () => void) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta reservación de sala?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await roomReservationService.cancelRoomReservation(id);

      alert('Reservación de sala cancelada exitosamente');
      reloadComedorReservations();
      loadRoomReservations();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error && 'response' in err
        ? (() => {
            const axiosError = err as { response?: { data?: unknown } };
            const data = axiosError.response?.data;
            return typeof data === 'string' ? data
              : (data as { message?: string; error?: string })?.message
              || (data as { message?: string; error?: string })?.error
              || JSON.stringify(data);
          })()
        : 'Error al cancelar la reservación de sala';
      alert(errorMessage);
      console.error('Error al cancelar reservación de sala:', err);
    }
  }, [loadRoomReservations]);

  // Cancelar cualquier reservación de sala (sin recargar comedor)
  const handleCancelAnyRoomReservation = useCallback(async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta reservación de sala?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await roomReservationService.cancelRoomReservation(id);

      alert('Reservación de sala cancelada exitosamente');
      loadRoomReservations();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error && 'response' in err
        ? (() => {
            const axiosError = err as { response?: { data?: unknown } };
            const data = axiosError.response?.data;
            return typeof data === 'string' ? data
              : (data as { message?: string; error?: string })?.message
              || (data as { message?: string; error?: string })?.error
              || JSON.stringify(data);
          })()
        : 'Error al cancelar la reservación de sala';
      alert(errorMessage);
      console.error('Error al cancelar reservación de sala:', err);
    }
  }, [loadRoomReservations]);

  // Abrir el modal de reprogramación
  const handleOpenReschedule = useCallback((reservation: RoomReservation) => {
    setReservationToReschedule(reservation);
    setRescheduleDate('');
    setRescheduleStartTime('');
    setRescheduleEndTime('');
    setRescheduleError('');
    setShowRescheduleModal(true);
  }, []);

  // Verificar disponibilidad de horario
  const checkTimeAvailability = useCallback(async () => {
    if (!rescheduleDate || !rescheduleStartTime || !rescheduleEndTime || !reservationToReschedule) {
      return;
    }

    // Validar que la hora de fin sea después de la hora de inicio
    if (rescheduleEndTime <= rescheduleStartTime) {
      setRescheduleError('La hora de fin debe ser después de la hora de inicio');
      return;
    }

    try {
      setCheckingAvailability(true);
      setRescheduleError('');
      const token = localStorage.getItem('token');
      if (!token) return;

      // Verificar disponibilidad
      const result = await roomReservationService.checkRoomAvailability({
        date: rescheduleDate,
        startTime: rescheduleStartTime,
        endTime: rescheduleEndTime,
        excludeReservationId: reservationToReschedule.id
      });

      if (!result.isAvailable) {
        setRescheduleError(result.message || 'El horario seleccionado no está disponible');
      }
    } catch (error) {
      const errorMessage = error instanceof Error && 'response' in error
        ? (error as { response?: { data?: unknown } }).response?.data
        : 'Error al verificar disponibilidad';
      setRescheduleError(String(errorMessage));
    } finally {
      setCheckingAvailability(false);
    }
  }, [rescheduleDate, rescheduleStartTime, rescheduleEndTime, reservationToReschedule]);

  // Reprogramar una reservación
  const handleReschedule = useCallback(async (reloadComedorReservations: () => void) => {
    if (!reservationToReschedule || !rescheduleDate || !rescheduleStartTime || !rescheduleEndTime) {
      setRescheduleError('Por favor completa todos los campos');
      return;
    }

    if (rescheduleEndTime <= rescheduleStartTime) {
      setRescheduleError('La hora de fin debe ser después de la hora de inicio');
      return;
    }

    if (rescheduleError) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await roomReservationService.updateRoomReservation(
        reservationToReschedule.id,
        {
          date: rescheduleDate,
          startTime: rescheduleStartTime,
          endTime: rescheduleEndTime
        }
      );

      alert('Reservación reprogramada exitosamente');
      setShowRescheduleModal(false);
      setReservationToReschedule(null);
      setRescheduleDate('');
      setRescheduleStartTime('');
      setRescheduleEndTime('');
      setRescheduleError('');
      reloadComedorReservations();
      loadRoomReservations();
    } catch (err: unknown) {
      if (err instanceof Error && 'response' in err) {
        const axiosError = err as { response?: { data?: unknown } };
        const errorData = axiosError.response?.data;
        if (typeof errorData === 'string') {
          setRescheduleError(errorData);
        } else if (errorData && typeof errorData === 'object' && 'message' in errorData) {
          setRescheduleError((errorData as { message: string }).message);
        } else {
          setRescheduleError('Error al reprogramar la reservación');
        }
      } else {
        setRescheduleError('Error al reprogramar la reservación');
      }
      console.error('Error al reprogramar reservación:', err);
    }
  }, [reservationToReschedule, rescheduleDate, rescheduleStartTime, rescheduleEndTime, rescheduleError, loadRoomReservations]);

  return {
    // Estado
    roomReservations,
    myAdminRoomReservations,
    showRescheduleModal,
    setShowRescheduleModal,
    reservationToReschedule,
    rescheduleDate,
    setRescheduleDate,
    rescheduleStartTime,
    setRescheduleStartTime,
    rescheduleEndTime,
    setRescheduleEndTime,
    rescheduleError,
    setRescheduleError,
    checkingAvailability,
    
    // Funciones
    loadRoomReservations,
    loadAdminRoomReservations,
    handleCancelAdminRoomReservation,
    handleCancelAnyRoomReservation,
    handleOpenReschedule,
    checkTimeAvailability,
    handleReschedule
  };
};
