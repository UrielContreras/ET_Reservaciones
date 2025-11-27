import { useState } from 'react';
import '../Styles/Reserv_home.css';
import CreateReserv from './Create_reserv';

const HomeAdmin = () => {
  const [showCreateReserv, setShowCreateReserv] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userType');
    window.location.hash = '';
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
            <p className="card-number">0</p>
            <button className="btn-card">Gestionar</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">➕</div>
            <h3>Nueva Reservación</h3>
            <p className="card-text">Crear reservación manual</p>
            <button className="btn-card primary" onClick={() => setShowCreateReserv(true)}>Crear</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">📈</div>
            <h3>Estadísticas</h3>
            <p className="card-text">Ver reportes</p>
            <button className="btn-card">Ver más</button>
          </div>
        </div>

        <section className="recent-section">
          <h2>Todas las Reservaciones del Sistema</h2>
          <div className="empty-state">
            <p>No hay reservaciones registradas</p>
            <span>Las reservaciones de todos los usuarios aparecerán aquí</span>
          </div>
        </section>
      </div>
    </div>
    {showCreateReserv && <CreateReserv onClose={() => setShowCreateReserv(false)} />}
    </>
  );
};

export default HomeAdmin;
