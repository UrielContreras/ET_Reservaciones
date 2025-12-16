import { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import '../Styles/Auth.css';

interface RegisterProps {
  onClose: () => void;
}

const Register = ({ onClose }: RegisterProps) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    area: '',
    userType: 'empleado' as 'empleado' | 'admin'
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Capitalizar la primera letra para los campos firstName y lastName
    let processedValue = value;
    if (name === 'firstName' || name === 'lastName') {
      processedValue = value.charAt(0).toUpperCase() + value.slice(1);
      
      // Auto-generar contraseña cuando ambos campos estén completos
      const updatedFormData = {
        ...formData,
        [name]: processedValue
      };
      
      const firstName = name === 'firstName' ? processedValue : formData.firstName;
      const lastName = name === 'lastName' ? processedValue : formData.lastName;
      
      if (firstName && lastName) {
        const generatedPassword = generatePassword(firstName, lastName);
        setFormData({
          ...updatedFormData,
          password: generatedPassword,
          confirmPassword: generatedPassword
        });
        return;
      }
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
        area: formData.area
      });

      setSuccessMessage(`¡Registro exitoso! La contraseña temporal asignada es: "${formData.password}". Por favor, compártela con el usuario creado.`);
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
          <h1>Crear nuevo usuario</h1>
          <p>Agrega un usuario tipo empleado/administrador</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="userType">Tipo de usuario</label>
            <select
              id="userType"
              name="userType"
              value={formData.userType}
              onChange={handleChange}
              required
            >
              <option value="empleado">Empleado</option>
              <option value="admin">Administrador RH</option>
            </select>
          </div>

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
            <strong>📌 Nota:</strong> La contraseña se generará automáticamente basada en el nombre y apellido (formato: PrimerLetra.PrimeraLetraApellido.RestoDelApellido). Puedes modificarla si lo deseas.
          </div>
          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}

          <button type="submit" className="btn-primary">
            Registrarse
          </button>
        </form>

       
      </div>
    </div>
  );
};

export default Register;