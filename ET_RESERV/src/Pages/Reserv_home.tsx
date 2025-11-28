import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import '../Styles/Reserv_home.css';
import CreateReserv from './Create_reserv';

interface Reservation {
  id: number;
  date: string;
  timeSlotId: number;
  timeRange: string;
  status: string;
}

const ReservHome = () => {
  const [showCreateReserv, setShowCreateReserv] = useState(false);
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMyReservations, setShowMyReservations] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    fetchMyReservations();
    fetchAllReservations();
  }, []);

  const fetchMyReservations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/api/reservations/today`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setMyReservations(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setLoading(false);
    }
  };

  const fetchAllReservations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/api/reservations/my-reservations`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setAllReservations(response.data);
    } catch (err) {
      console.error('Error fetching all reservations:', err);
    }
  };

  const handleCancelReservation = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta reservación?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await axios.post(
        `${API_BASE_URL}/api/reservations/${id}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert('Reservación cancelada exitosamente');
      fetchMyReservations();
    } catch (err: any) {
      if (err.response?.data) {
        alert(err.response.data);
      } else {
        alert('Error al cancelar la reservación');
      }
      console.error('Error canceling reservation:', err);
    }
  };

  const handleReservationCreated = () => {
    setShowCreateReserv(false);
    fetchMyReservations();
    fetchAllReservations();
  };

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
        <p className="card-number">{allReservations.length}</p>
        <button className="btn-card" onClick={() => setShowMyReservations(true)}>Ver todas</button>
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
        <p className="card-number">{allReservations.filter(r => r.status === 'Active').length}</p>
        <button className="btn-card" onClick={() => setShowPending(true)}>Revisar</button>
        </div>

        <div className="dashboard-card" style={{ minWidth: 220 }}>
        <div className="card-icon">✅</div>
        <h3>Completadas</h3>
        <p className="card-number">{allReservations.filter(r => r.status === 'Cancelled' || r.status === 'Expired').length}</p>
        <button className="btn-card" onClick={() => setShowCompleted(true)}>Ver historial</button>
        </div>
      </div>

      <section className="recent-section">
        <h2>Reservaciones de hoy</h2>
        {loading ? (
          <div className="empty-state">
            <p>Cargando...</p>
          </div>
        ) : myReservations.filter(r => r.status === 'Active').length === 0 ? (
          <div className="empty-state">
            <p>No hay reservaciones activas para hoy</p>
            <span>Las reservaciones aparecerán aquí</span>
          </div>
        ) : (
          <div className="reservations-list">
            {myReservations.filter(r => r.status === 'Active').map((reservation) => (
              <div key={reservation.id} className="reservation-card">
                <div className="reservation-info">
                  <div className="reservation-time">
                    <span className="time-icon">🕐</span>
                    <span className="time-text">{reservation.timeRange}</span>
                  </div>
                  <div className="reservation-date">
                    <span>📅 {reservation.date}</span>
                  </div>
                </div>
                <div className="reservation-actions">
                  <span className="reservation-status status-active">Activa</span>
                  <button 
                    className="btn-cancel"
                    onClick={() => handleCancelReservation(reservation.id)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
    </div>

    {showCreateReserv && <CreateReserv onClose={handleReservationCreated} />}

    {/* Modal de Mis Reservaciones */}
    {showMyReservations && (
      <div className="modal-overlay" onClick={() => setShowMyReservations(false)}>
        <div className="auth-card" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={() => setShowMyReservations(false)}>&times;</button>
          <div className="auth-header">
            <h1>Mis Reservaciones</h1>
            <p>Todo tu historial de reservaciones</p>
          </div>
          <div className="modal-content">
            {allReservations.length === 0 ? (
              <div className="empty-state">
                <p>No tienes reservaciones</p>
              </div>
            ) : (
              <div className="reservations-list">
                {allReservations.map((reservation) => (
                  <div key={reservation.id} className="reservation-card">
                    <div className="reservation-info">
                      <div className="reservation-time">
                        <span className="time-icon">🕐</span>
                        <span className="time-text">{reservation.timeRange}</span>
                      </div>
                      <div className="reservation-date">
                        <span>📅 {reservation.date}</span>
                      </div>
                    </div>
                    <span className={`reservation-status ${
                      reservation.status === 'Active' ? 'status-active' :
                      reservation.status === 'Cancelled' ? 'status-cancelled' : 'status-expired'
                    }`}>
                      {reservation.status === 'Active' ? 'Activa' :
                       reservation.status === 'Cancelled' ? 'Cancelada' : 'Completada'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Modal de Pendientes */}
    {showPending && (
      <div className="modal-overlay" onClick={() => setShowPending(false)}>
        <div className="auth-card" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={() => setShowPending(false)}>&times;</button>
          <div className="auth-header">
            <h1>Reservaciones Pendientes</h1>
            <p>Reservaciones activas que aún no han sido utilizadas</p>
          </div>
          <div className="modal-content">
            {allReservations.filter(r => r.status === 'Active').length === 0 ? (
              <div className="empty-state">
                <p>No tienes reservaciones pendientes</p>
              </div>
            ) : (
              <div className="reservations-list">
                {allReservations.filter(r => r.status === 'Active').map((reservation) => (
                  <div key={reservation.id} className="reservation-card">
                    <div className="reservation-info">
                      <div className="reservation-time">
                        <span className="time-icon">🕐</span>
                        <span className="time-text">{reservation.timeRange}</span>
                      </div>
                      <div className="reservation-date">
                        <span>📅 {reservation.date}</span>
                      </div>
                    </div>
                    <span className="reservation-status status-pending">Pendiente</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Modal de Completadas */}
    {showCompleted && (
      <div className="modal-overlay" onClick={() => setShowCompleted(false)}>
        <div className="auth-card" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={() => setShowCompleted(false)}>&times;</button>
          <div className="auth-header">
            <h1>Historial de Reservaciones</h1>
            <p>Reservaciones canceladas o expiradas</p>
          </div>
          <div className="modal-content">
            {allReservations.filter(r => r.status === 'Cancelled' || r.status === 'Expired').length === 0 ? (
              <div className="empty-state">
                <p>No hay reservaciones en el historial</p>
              </div>
            ) : (
              <div className="reservations-list">
                {allReservations.filter(r => r.status === 'Cancelled' || r.status === 'Expired').map((reservation) => (
                  <div key={reservation.id} className="reservation-card">
                    <div className="reservation-info">
                      <div className="reservation-time">
                        <span className="time-icon">🕐</span>
                        <span className="time-text">{reservation.timeRange}</span>
                      </div>
                      <div className="reservation-date">
                        <span>📅 {reservation.date}</span>
                      </div>
                    </div>
                    <span className={`reservation-status ${reservation.status === 'Cancelled' ? 'status-cancelled' : 'status-expired'}`}>
                      {reservation.status === 'Cancelled' ? 'Cancelada' : 'Expirada'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default ReservHome;
