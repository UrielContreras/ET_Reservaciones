import { useState } from 'react';
import '../Styles/Auth.css';

interface LoginProps {
  onClose: () => void;
}

const Login = ({ onClose }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'empleado' | 'admin'>('empleado');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login:', { email, password, userType });
    
    // Simular autenticación exitosa
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userType', userType);
    window.dispatchEvent(new Event('storage'));
    onClose();
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
          <h1>Bienvenido</h1>
          <p>Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="userType">Tipo de usuario</label>
            <select
              id="userType"
              value={userType}
              onChange={(e) => setUserType(e.target.value as 'empleado' | 'admin')}
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
              onChange={(e) => setEmail(e.target.value)}
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
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

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