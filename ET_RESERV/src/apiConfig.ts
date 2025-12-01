// Detectar si estamos en desarrollo local o producción
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:5269' 
  : 'https://api-comedor-dev-g0b5edfpguemhvdx.northcentralus-01.azurewebsites.net';
