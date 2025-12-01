import { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import '../Styles/Auth.css';

interface RegisterEmployeeProps {
  onClose: () => void;
}

const RegisterEmployee = ({ onClose }: RegisterEmployeeProps) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    area: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validar que las contraseñas coincidan
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/api/auth/register`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        area: formData.area,
        role: 0 // Siempre empleado (0)
      });

      setSuccessMessage('¡Registro exitoso! Redirigiendo al inicio de sesión...');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        setError(err.response.data);
      } else {
        setError('Error al registrar. Por favor intenta de nuevo.');
      }
      console.error('Registration failed:', err);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="auth-card">
        <button className="modal-close" onClick={onClose}>&times;</button>
        <div className="auth-header">
          <h1>Crear Cuenta</h1>
          <p>Regístrate como empleado para hacer reservaciones</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="firstName">Nombre</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Juan"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Apellido</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Pérez"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="area">Área</label>
            <input
              type="text"
              id="area"
              name="area"
              value={formData.area}
              onChange={handleChange}
              placeholder="Departamento"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar contraseña</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Repite tu contraseña"
              required
            />
          </div>

          {error && (
            <div style={{
              padding: '10px',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '8px',
              color: '#c33',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}

          {successMessage && (
            <div style={{
              padding: '10px',
              backgroundColor: '#efe',
              border: '1px solid #cfc',
              borderRadius: '8px',
              color: '#3c3',
              fontSize: '0.9rem'
            }}>
              {successMessage}
            </div>
          )}

          <button type="submit" className="btn-primary">
            Crear Cuenta
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterEmployee;
