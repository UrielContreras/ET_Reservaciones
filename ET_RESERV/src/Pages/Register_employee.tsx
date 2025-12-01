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
    area: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Genera contraseña en formato: PrimerLetraNombre.PrimeraLetraApellido.RestoDelApellido
  const generatePassword = (firstName: string, lastName: string): string => {
    if (!firstName || !lastName) return '';
    const firstInitial = firstName.charAt(0).toUpperCase();
    const lastInitial = lastName.charAt(0).toUpperCase();
    const restOfLastName = lastName.substring(1).toLowerCase();
    return `${firstInitial}.${lastInitial}.${restOfLastName}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Capitalizar la primera letra para los campos firstName y lastName
    let processedValue = value;
    if (name === 'firstName' || name === 'lastName') {
      processedValue = value.charAt(0).toUpperCase() + value.slice(1);
    }
    
    setFormData({
      ...formData,
      [name]: processedValue
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const generatedPassword = generatePassword(formData.firstName, formData.lastName);

    try {
      await axios.post(`${API_BASE_URL}/api/auth/register`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: generatedPassword,
        area: formData.area,
        role: 0 // Siempre empleado (0)
      });

      setSuccessMessage(`¡Registro exitoso! La contraseña temporal es: "${generatedPassword}". El usuario debe cambiarla al iniciar sesión por primera vez.`);
      
      // Mantener el mensaje visible por más tiempo para que se pueda copiar la contraseña
      setTimeout(() => {
        onClose();
      }, 5000);
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

          <div style={{
            padding: '12px',
            backgroundColor: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '8px',
            color: '#0369a1',
            fontSize: '0.9rem',
            marginBottom: '1rem'
          }}>
            <strong>📌 Nota:</strong> Se generará automáticamente una contraseña temporal basada en el nombre y apellido (formato: PrimerLetra.PrimeraLetraApellido.RestoDelApellido). El usuario deberá cambiarla al iniciar sesión por primera vez.
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
              padding: '15px',
              backgroundColor: '#dcfce7',
              border: '2px solid #86efac',
              borderRadius: '8px',
              color: '#166534',
              fontSize: '0.95rem',
              fontWeight: '500',
              lineHeight: '1.6'
            }}>
              ✓ {successMessage}
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
