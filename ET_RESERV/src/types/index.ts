/**
 * Tipos e interfaces centralizadas del proyecto
 * Single source of truth para todos los modelos de datos
 */

// ==================== USUARIOS ====================

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  area: string;
  role: string;
}

// ==================== RESERVACIONES DE COMEDOR ====================

export interface Reservation {
  id: number;
  userName: string;
  email: string;
  area?: string;
  date: string;
  timeRange?: string;
  status: string;
  type?: 'comedor' | 'sala';
}

export interface AdminReservation {
  id: number;
  userName: string;
  email: string;
  area?: string;
  date: string;
  timeSlotId?: number;
  timeRange: string;
  status: string;
}

// ==================== RESERVACIONES DE SALAS ====================

export interface RoomReservation {
  id: number;
  date: string;
  timeRange: string;
  status: string;
  userName: string;
  email: string;
  area: string;
  meetingName?: string;
}

// ==================== TIPOS AUXILIARES ====================

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled';
export type ReservationType = 'comedor' | 'sala' | 'all';
export type SortDirection = 'asc' | 'desc';
