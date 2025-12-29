// Detectar si estamos en desarrollo local o producción
const isDevelopment = 
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1' ||
  window.location.protocol === 'file:' || // Cuando se abre el HTML directamente
  import.meta.env.DEV; // Variable de Vite para modo desarrollo

export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:5269' 
  : 'https://comedorsalaapi-cpbbfna7e2h5gght.westus2-01.azurewebsites.net';

console.log('[API CONFIG] Usando API:', API_BASE_URL);
console.log('[API CONFIG] Hostname:', window.location.hostname);
console.log('[API CONFIG] Protocol:', window.location.protocol);
console.log('[API CONFIG] Vite DEV mode:', import.meta.env.DEV);
