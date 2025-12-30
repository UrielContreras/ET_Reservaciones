/**
 * Servicio para operaciones relacionadas con reservaciones de comedor
 */

import { authenticatedGet, authenticatedPost } from './api';
import type { Reservation, AdminReservation } from '../types';

/**
 * Obtiene todas las reservaciones
 */
export const getAllReservations = async (): Promise<Reservation[]> => {
  return authenticatedGet<Reservation[]>('/api/reservations/all');
};

/**
 * Obtiene las reservaciones del usuario actual (admin)
 */
export const getMyReservations = async (): Promise<AdminReservation[]> => {
  return authenticatedGet<AdminReservation[]>('/api/reservations/my-reservations');
};

/**
 * Obtiene información de debug del usuario
 */
export const getDebugUserInfo = async (): Promise<unknown> => {
  return authenticatedGet<unknown>('/api/reservations/debug-user');
};

/**
 * Cancela una reservación
 */
export const cancelReservation = async (id: number): Promise<void> => {
  return authenticatedPost<void>(`/api/reservations/${id}/cancel`, {});
};

/**
 * Crea una nueva reservación
 */
export const createReservation = async (reservationData: Partial<Reservation>): Promise<Reservation> => {
  return authenticatedPost<Reservation>('/api/reservations', reservationData);
};
