/**
 * Servicio para operaciones relacionadas con usuarios
 */

import { authenticatedGet, authenticatedPost, authenticatedDelete } from './api';
import type { User } from '../types';

/**
 * Obtiene todos los usuarios
 */
export const getAllUsers = async (): Promise<User[]> => {
  return authenticatedGet<User[]>('/api/users');
};

/**
 * Obtiene un usuario por ID
 */
export const getUserById = async (id: number): Promise<User> => {
  return authenticatedGet<User>(`/api/users/${id}`);
};

/**
 * Crea un nuevo usuario
 */
export const createUser = async (userData: Partial<User>): Promise<User> => {
  return authenticatedPost<User>('/api/users', userData);
};

/**
 * Actualiza un usuario existente
 */
export const updateUser = async (id: number, userData: Partial<User>): Promise<User> => {
  return authenticatedPost<User>(`/api/users/${id}`, userData);
};

/**
 * Elimina un usuario
 */
export const deleteUser = async (id: number): Promise<void> => {
  return authenticatedDelete<void>(`/api/users/${id}`);
};

/**
 * Obtiene el perfil del usuario actual
 */
export const getCurrentUserProfile = async (): Promise<{ firstName: string }> => {
  return authenticatedGet<{ firstName: string }>('/api/profile/me');
};
