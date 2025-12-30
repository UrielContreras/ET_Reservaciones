/**
 * Configuración base para llamadas a la API
 * Centraliza la configuración de axios y utilidades comunes
 */

import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../apiConfig';

/**
 * Instancia configurada de axios
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Obtiene el token de autenticación desde localStorage
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

/**
 * Obtiene headers con autenticación
 */
export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Realiza una petición GET autenticada
 */
export const authenticatedGet = async <T>(url: string, config?: AxiosRequestConfig) => {
  const response = await apiClient.get<T>(url, {
    ...config,
    headers: {
      ...getAuthHeaders(),
      ...config?.headers,
    },
  });
  return response.data;
};

/**
 * Realiza una petición POST autenticada
 */
export const authenticatedPost = async <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
) => {
  const response = await apiClient.post<T>(url, data, {
    ...config,
    headers: {
      ...getAuthHeaders(),
      ...config?.headers,
    },
  });
  return response.data;
};

/**
 * Realiza una petición PUT autenticada
 */
export const authenticatedPut = async <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
) => {
  const response = await apiClient.put<T>(url, data, {
    ...config,
    headers: {
      ...getAuthHeaders(),
      ...config?.headers,
    },
  });
  return response.data;
};

/**
 * Realiza una petición DELETE autenticada
 */
export const authenticatedDelete = async <T>(url: string, config?: AxiosRequestConfig) => {
  const response = await apiClient.delete<T>(url, {
    ...config,
    headers: {
      ...getAuthHeaders(),
      ...config?.headers,
    },
  });
  return response.data;
};

export default apiClient;
