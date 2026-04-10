import axios from 'axios';

const PROD_API_BASE_URL = 'https://comedorsalaapi-cpbbfna7e2h5gght.westus2-01.azurewebsites.net';

export const clearAuthStorage = (redirectToLogin = true) => {
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('userType');
  localStorage.removeItem('token');
  sessionStorage.clear();
  window.dispatchEvent(new Event('storage'));
  if (redirectToLogin) {
    window.location.hash = 'login';
  }
};

const isPrivateIpv4 = (hostname: string): boolean => {
  const parts = hostname.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return false;
  }

  const [a, b] = parts;
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
};

const hostname = window.location.hostname;
const envApiUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
const useLocalApi =
  import.meta.env.DEV ||
  hostname === 'localhost' ||
  hostname === '127.0.0.1' ||
  window.location.protocol === 'file:' ||
  isPrivateIpv4(hostname);

export const API_BASE_URL = envApiUrl?.trim() || (useLocalApi ? 'http://localhost:5269' : PROD_API_BASE_URL);

console.log('[API CONFIG] Usando API:', API_BASE_URL);
console.log('[API CONFIG] Hostname:', hostname);
console.log('[API CONFIG] Protocol:', window.location.protocol);
console.log('[API CONFIG] Vite DEV mode:', import.meta.env.DEV);
console.log('[API CONFIG] VITE_API_BASE_URL:', envApiUrl || '(no definida)');

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      const hasAuth =
        localStorage.getItem('isAuthenticated') === 'true' ||
        Boolean(localStorage.getItem('token'));
      if (hasAuth) {
        clearAuthStorage(true);
      }
    }
    return Promise.reject(error);
  }
);
