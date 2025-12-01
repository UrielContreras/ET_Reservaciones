// Detectar si estamos en desarrollo local o producción
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:5269' 
  : 'https://comedorsalaapi-cpbbfna7e2h5gght.westus2-01.azurewebsites.net';
