import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import '../Styles/Auth.css';

interface LoginProps {
  onClose: () => void;
}

const Login: React.FC<LoginProps> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'empleado' | 'admin'>('empleado');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
        requestedRole: userType // Enviar el tipo de usuario seleccionado
      });

      const { token, role } = response.data;

      // Guardar autenticación
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userType', role === 'HR' ? 'admin' : 'empleado');
      localStorage.setItem('token', token);
      window.dispatchEvent(new Event('storage'));
      onClose();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        setError(err.response.data);
      } else {
        setError('Credenciales inválidas o error del servidor.');
      }
      console.error('Login failed:', err);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
// ... (el resto del componente sigue igual)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="auth-card">
        <button className="modal-close" onClick={onClose}>&times;</button>
        <div className="auth-header">
          <h1>Bienvenido</h1>
          <p>Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="userType">Tipo de usuario</label>
            <select
              id="userType"
              value={userType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setUserType(e.target.value as 'empleado' | 'admin')}
              required
            >
              <option value="empleado">Empleado</option>
              <option value="admin">Administrador RH</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-primary">
            Iniciar Sesión
          </button>
        </form>

        <div className="auth-footer">
          <p>¿No tienes una cuenta? <a href="#register">Regístrate</a></p>
        </div>
      </div>
    </div>
  );
};

export default Login;