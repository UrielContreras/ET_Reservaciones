import { useState } from 'react';
import '../Styles/Reserv_home.css';
import CreateReserv from './Create_reserv';

const ReservHome = () => {
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
          <h2>ET Reservaciones</h2>
        </div>
        <div className="nav-user">
          <span>Bienvenido</span>
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
        <h1>Panel de Reservaciones</h1>
        <p>Gestiona tus reservaciones de manera fácil y rápida</p>
      </header>

      <div
        className="reserv-dashboard"
        style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '1rem',
        flexWrap: 'nowrap',
        alignItems: 'stretch',
        overflowX: 'auto',
        paddingBottom: '0.5rem'
        }}
      >
        <div className="dashboard-card" style={{ minWidth: 220 }}>
        <div className="card-icon">📅</div>
        <h3>Mis Reservaciones</h3>
        <p className="card-number">0</p>
        <button className="btn-card">Ver todas</button>
        </div>

        <div className="dashboard-card" style={{ minWidth: 220 }}>
        <div className="card-icon">➕</div>
        <h3>Nueva Reservación</h3>
        <p className="card-text">Crea una nueva reservación</p>
        <button className="btn-card primary" onClick={() => setShowCreateReserv(true)}>Crear</button>
        </div>

        <div className="dashboard-card" style={{ minWidth: 220 }}>
        <div className="card-icon">🕐</div>
        <h3>Pendientes</h3>
        <p className="card-number">0</p>
        <button className="btn-card">Revisar</button>
        </div>

        <div className="dashboard-card" style={{ minWidth: 220 }}>
        <div className="card-icon">✅</div>
        <h3>Completadas</h3>
        <p className="card-number">0</p>
        <button className="btn-card">Ver historial</button>
        </div>
      </div>

      <section className="recent-section">
        <h2>Reservaciones de ET hoy</h2>
        <div className="empty-state">
        <p>No hay reservaciones para hoy</p>
        <span>Las reservaciones aparecerán aquí</span>
        </div>
      </section>
    </div>
    </div>
    {showCreateReserv && <CreateReserv onClose={() => setShowCreateReserv(false)} />}
    </>
  );
};

export default ReservHome;
