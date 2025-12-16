// Detectar si estamos accediendo localmente o desde la red
const isLocalhost = 
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1';

const isNetworkAccess = 
  window.location.hostname.startsWith('172.') ||
  window.location.hostname.startsWith('192.') ||
  window.location.hostname.startsWith('10.');

// Determinar la URL base del API
let apiUrl: string;

if (isLocalhost) {
  // Acceso desde localhost
  apiUrl = 'http://localhost:5001';
} else if (isNetworkAccess) {
  // Acceso desde la red local - usar la misma IP con puerto 5001
  apiUrl = `http://${window.location.hostname}:5001`;
} else {
  // Acceso desde internet - usar ngrok
  apiUrl = 'https://uncorruptedly-unverdured-britni.ngrok-free.dev';
}

export const API_BASE_URL = apiUrl;

// Solo en desarrollo - comentar en producción
if (import.meta.env.DEV) {
  console.log('[API CONFIG] Usando API:', API_BASE_URL);
  console.log('[API CONFIG] Hostname:', window.location.hostname);
  console.log('[API CONFIG] isLocalhost:', isLocalhost);
  console.log('[API CONFIG] isNetworkAccess:', isNetworkAccess);
}
