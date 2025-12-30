/**
 * Servicio para operaciones relacionadas con reservaciones de salas
 */

import { authenticatedGet, authenticatedPost, authenticatedPut } from './api';
import type { RoomReservation } from '../types';

/**
 * Obtiene todas las reservaciones de salas
 */
export const getAllRoomReservations = async (): Promise<RoomReservation[]> => {
  return authenticatedGet<RoomReservation[]>('/api/roomreservations/all');
};

/**
 * Obtiene las reservaciones de salas del usuario actual
 */
export const getMyRoomReservations = async (): Promise<RoomReservation[]> => {
  return authenticatedGet<RoomReservation[]>('/api/roomreservations/my-reservations');
};

/**
 * Cancela una reservación de sala
 */
export const cancelRoomReservation = async (id: number): Promise<void> => {
  return authenticatedPut<void>(`/api/roomreservations/${id}/cancel`, {});
};

/**
 * Verifica disponibilidad de sala en un horario específico
 */
export const checkRoomAvailability = async (params: {
  date: string;
  startTime: string;
  endTime: string;
  excludeReservationId?: number;
}): Promise<{ isAvailable: boolean; message?: string }> => {
  return authenticatedPost<{ isAvailable: boolean; message?: string }>(
    '/api/roomreservations/check-availability',
    params
  );
};

/**
 * Actualiza/reprograma una reservación de sala
 */
export const updateRoomReservation = async (
  id: number,
  data: { date: string; startTime: string; endTime: string }
): Promise<RoomReservation> => {
  return authenticatedPut<RoomReservation>(`/api/roomreservations/${id}`, data);
};

/**
 * Crea una nueva reservación de sala
 */
export const createRoomReservation = async (
  reservationData: Partial<RoomReservation>
): Promise<RoomReservation> => {
  return authenticatedPost<RoomReservation>('/api/roomreservations', reservationData);
};
