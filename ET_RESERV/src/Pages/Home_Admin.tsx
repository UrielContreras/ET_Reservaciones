import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import '../Styles/Reserv_home.css';
import Register from './Register';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  area: string;
  role: string;
}

const HomeAdmin = () => {
  const [showRegister, setShowRegister] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userType');
    window.location.hash = '';
  };

  const handleRegisterClose = () => {
    setShowRegister(false);
    loadUsers(); // Recargar usuarios después de crear uno nuevo
  };

  return (
    <>
    <div className="reserv-container">
      <nav className="reserv-navbar">
        <div className="nav-brand">
          <h2>ET Reservaciones - Panel Admin</h2>
        </div>
        <div className="nav-user">
          <span className="admin-badge">👔 Administrador RH</span>
          <button
            onClick={() => {
                handleLogout();
                window.location.href = '/';
            }}
            className="btn-logout"
        >
            Cerrar Sesión
        </button>
        </div>
      </nav>

      <div className="reserv-content">
        <header className="reserv-header">
          <h1>Panel de Administración</h1>
          <p>Gestiona todas las reservaciones y usuarios del sistema</p>
        </header>

        <div className="reserv-dashboard">
          <div className="dashboard-card">
            <div className="card-icon">📊</div>
            <h3>Total Reservaciones</h3>
            <p className="card-number">0</p>
            <button className="btn-card">Ver todas</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">👥</div>
            <h3>Usuarios Activos</h3>
            <p className="card-number">{users.length}</p>
            <button className="btn-card">Gestionar</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">➕</div>
            <h3>Nuevo Usuario</h3>
            <p className="card-text">Crear usuario manualmente</p>
            <button className="btn-card primary" onClick={() => setShowRegister(true)}>Crear</button>
          </div>

        </div>

        <section className="recent-section">
          <h2>Todos los Usuarios del Sistema</h2>
          {loading ? (
            <div className="empty-state">
              <p>Cargando usuarios...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <p>No hay usuarios registrados</p>
              <span>Los usuarios aparecerán aquí</span>
            </div>
          ) : (
            <div className="table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Apellido</th>
                    <th>Correo</th>
                    <th>Área</th>
                    <th>Rol</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.firstName}</td>
                      <td>{user.lastName}</td>
                      <td>{user.email}</td>
                      <td>{user.area || 'N/A'}</td>
                      <td>
                        <span className={`role-badge ${user.role === 'Employee' ? 'employee' : 'admin'}`}>
                          {user.role === 'Employee' ? 'Empleado' : 'Administrador'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
    {showRegister && <Register onClose={handleRegisterClose} />}
    </>
  );
};

export default HomeAdmin;
