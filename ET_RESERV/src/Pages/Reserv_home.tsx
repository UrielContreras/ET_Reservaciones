import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import '../Styles/Reserv_home.css';
import CreateReserv from './Create_reserv';
import CreateRoomReserv from './Create_room_reserv';
import ChangePassword from './ChangePassword';
import { CalendarIcon, ClockIcon, PlusIcon, CheckIcon } from '../components/Icons';

interface Reservation {
  id: number;
  date: string;
  timeSlotId: number;
  timeRange: string;
  status: string;
  type?: 'comedor' | 'sala';
}

interface RoomReservation {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  timeRange: string;
  status: string;
}

const ReservHome = () => {
  const [showCreateReserv, setShowCreateReserv] = useState(false);
  const [showCreateRoomReserv, setShowCreateRoomReserv] = useState(false);
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [myRoomReservations, setMyRoomReservations] = useState<RoomReservation[]>([]);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  const [allRoomReservations, setAllRoomReservations] = useState<RoomReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMyReservations, setShowMyReservations] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [userName, setUserName] = useState<string>('');

  // Función para formatear fecha sin problemas de zona horaria
  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString('es-MX');
  };

  const fetchMyReservations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/api/reservations/today`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('[FETCH_MY] Reservaciones de hoy recibidas:', response.data);
      console.log('[FETCH_MY] Cantidad:', response.data.length);
      
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

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        // Fetch user profile
        const profileResponse = await axios.get(`${API_BASE_URL}/api/profile/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setUserName(profileResponse.data.firstName);
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }

      try {
        // Fetch today's reservations
        const reservResponse = await axios.get(`${API_BASE_URL}/api/reservations/today`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log('[FETCH_MY] Reservaciones de hoy recibidas:', reservResponse.data);
        console.log('[FETCH_MY] Cantidad:', reservResponse.data.length);
        setMyReservations(reservResponse.data);
      } catch (err) {
        console.error('Error fetching reservations:', err);
      }

      try {
        // Fetch all reservations
        const allReservResponse = await axios.get(`${API_BASE_URL}/api/reservations/my-reservations`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setAllReservations(allReservResponse.data);
      } catch (err) {
        console.error('Error fetching all reservations:', err);
      }

      try {
        // Fetch room reservations (today)
        const roomResponse = await axios.get(`${API_BASE_URL}/api/roomreservations/today`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log('[ROOM RESERV] Reservaciones de sala de hoy:', roomResponse.data);
        setMyRoomReservations(roomResponse.data);
      } catch (err) {
        console.error('Error fetching room reservations:', err);
      }

      try {
        // Fetch all room reservations
        const allRoomResponse = await axios.get(`${API_BASE_URL}/api/roomreservations/my-reservations`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log('[ALL ROOM RESERV] Todas las reservaciones de sala:', allRoomResponse.data);
        setAllRoomReservations(allRoomResponse.data);
      } catch (err) {
        console.error('Error fetching all room reservations:', err);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

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
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data) {
        alert(err.response.data);
      } else {
        alert('Error al cancelar la reservación');
      }
      console.error('Error canceling reservation:', err);
    }
  };

  const handleCancelRoomReservation = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta reservación de sala?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await axios.put(
        `${API_BASE_URL}/api/roomreservations/${id}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert('Reservación de sala cancelada exitosamente');
      
      // Refrescar ambas listas de reservaciones de sala
      try {
        const roomResponse = await axios.get(`${API_BASE_URL}/api/roomreservations/today`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMyRoomReservations(roomResponse.data);

        const allRoomResponse = await axios.get(`${API_BASE_URL}/api/roomreservations/my-reservations`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAllRoomReservations(allRoomResponse.data);
      } catch (refreshErr) {
        console.error('Error refreshing room reservations:', refreshErr);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data) {
        alert(err.response.data);
      } else {
        alert('Error al cancelar la reservación de sala');
      }
      console.error('Error canceling room reservation:', err);
    }
  };


  const handleReservationCreated = () => {
    setShowCreateReserv(false);
    fetchMyReservations();
    fetchAllReservations();
  };

  const handleRoomReservationCreated = async () => {
    setShowCreateRoomReserv(false);
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const roomResponse = await axios.get(`${API_BASE_URL}/api/roomreservations/today`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyRoomReservations(roomResponse.data);

      const allRoomResponse = await axios.get(`${API_BASE_URL}/api/roomreservations/my-reservations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllRoomReservations(allRoomResponse.data);
    } catch (err) {
      console.error('Error refreshing room reservations:', err);
    }
  };

  const handleLogout = () => {
    // Limpiar completamente el localStorage
    localStorage.clear();
    
    // Limpiar sessionStorage también
    sessionStorage.clear();
    
    // Limpiar el hash
    window.location.hash = '';
    
    // Recargar la página sin caché
    window.location.replace('/');
  };

  return (
    <>
    <div className="reserv-container">
      <nav className="reserv-navbar">
        <div className="nav-brand">
          <h2>Reservaciones</h2>
        </div>
        <div className="nav-user">
          <span>Bienvenid@ {userName}</span>
        <button
            onClick={() => setShowChangePassword(true)}
            className="btn-logout"
            style={{ marginRight: '0.5rem' }}
        >
            Cambiar Contraseña
        </button>
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
        <div className="card-icon"><CalendarIcon size={32} color="#667eea" /></div>
        <h3>Mis Reservaciones</h3>
        <p className="card-number">{allReservations.length + allRoomReservations.length}</p>
        <button className="btn-card" onClick={() => setShowMyReservations(true)}>Ver todas</button>
        </div>

        <div className="dashboard-card" style={{ minWidth: 220 }}>
        <div className="card-icon"><PlusIcon size={32} color="#667eea" /></div>
        <h3>Nueva Reservación</h3>
        <p className="card-text">Comedor</p>
        <button className="btn-card primary" onClick={() => setShowCreateReserv(true)}>Crear</button>
        </div>

        <div className="dashboard-card" style={{ minWidth: 220 }}>
        <div className="card-icon"><PlusIcon size={32} color="#667eea" /></div>
        <h3>Nueva Reservación</h3>
        <p className="card-text">Sala de juntas</p>
        <button className="btn-card primary" onClick={() => setShowCreateRoomReserv(true)}>Crear</button>
        </div>

        <div className="dashboard-card" style={{ minWidth: 220 }}>
        <div className="card-icon"><ClockIcon size={32} color="#667eea" /></div>
        <h3>Pendientes</h3>
        <p className="card-number">{allReservations.filter(r => r.status === 'Active' || r.status === 'InProgress').length + allRoomReservations.filter(r => r.status === 'Active' || r.status === 'InProgress').length}</p>
        <button className="btn-card" onClick={() => setShowPending(true)}>Revisar</button>
        </div>

        <div className="dashboard-card" style={{ minWidth: 220 }}>
        <div className="card-icon"><CheckIcon size={32} color="#667eea" /></div>
        <h3>Completadas</h3>
        <p className="card-number">{allReservations.filter(r => r.status === 'Cancelled' || r.status === 'Expired').length + allRoomReservations.filter(r => r.status === 'Cancelled' || r.status === 'Expired').length}</p>
        <button className="btn-card" onClick={() => setShowCompleted(true)}>Ver historial</button>
        </div>
      </div>

      <section className="recent-section">
        <h2>Reservaciones de hoy</h2>
        {loading ? (
          <div className="empty-state">
            <p>Cargando...</p>
          </div>
        ) : myReservations.length === 0 && myRoomReservations.length === 0 ? (
          <div className="empty-state">
            <p>No hay reservaciones para hoy</p>
            <span>Las reservaciones aparecerán aquí</span>
          </div>
        ) : (
          <div className="reservations-list">
            {/* Reservaciones de Comedor */}
            {myReservations.map((reservation) => (
              <div key={`comedor-${reservation.id}`} className="reservation-card">
                <div className="reservation-info">
                  <div className="reservation-time">
                    <span className="time-icon"><ClockIcon size={20} color="#667eea" /></span>
                    <span className="time-text">{reservation.timeRange}</span>
                  </div>
                  <div className="reservation-date">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CalendarIcon size={18} color="#718096" /> 
                      {formatDate(reservation.date)} - Comedor
                    </span>
                  </div>
                </div>
                <div className="reservation-actions">
                  <span className={`reservation-status ${
                    reservation.status === 'Active' ? 'status-active' :
                    reservation.status === 'InProgress' ? 'status-inprogress' :
                    reservation.status === 'Cancelled' ? 'status-cancelled' : 'status-expired'
                  }`}>
                    {reservation.status === 'Active' ? 'Activa' :
                     reservation.status === 'InProgress' ? 'En Curso' :
                     reservation.status === 'Cancelled' ? 'Cancelada' : 'Expirada'}
                  </span>
                  {(reservation.status === 'Active' || reservation.status === 'InProgress') && (
                    <button 
                      className="btn-cancel"
                      onClick={() => handleCancelReservation(reservation.id)}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {/* Reservaciones de Sala */}
            {myRoomReservations.map((reservation) => (
              <div key={`sala-${reservation.id}`} className="reservation-card">
                <div className="reservation-info">
                  <div className="reservation-time">
                    <span className="time-icon"><ClockIcon size={20} color="#667eea" /></span>
                    <span className="time-text">{reservation.timeRange}</span>
                  </div>
                  <div className="reservation-date">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CalendarIcon size={18} color="#718096" /> 
                      {formatDate(reservation.date)} - Sala de Juntas
                    </span>
                  </div>
                </div>
                <div className="reservation-actions">
                  <span className={`reservation-status ${
                    reservation.status === 'Active' ? 'status-active' :
                    reservation.status === 'InProgress' ? 'status-inprogress' :
                    reservation.status === 'Cancelled' ? 'status-cancelled' : 'status-expired'
                  }`}>
                    {reservation.status === 'Active' ? 'Activa' :
                     reservation.status === 'InProgress' ? 'En Curso' :
                     reservation.status === 'Cancelled' ? 'Cancelada' : 'Expirada'}
                  </span>
                  {(reservation.status === 'Active' || reservation.status === 'InProgress') && (
                    <button 
                      className="btn-cancel"
                      onClick={() => handleCancelRoomReservation(reservation.id)}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
    </div>

    {showCreateReserv && <CreateReserv onClose={handleReservationCreated} />}
    {showCreateRoomReserv && <CreateRoomReserv onClose={handleRoomReservationCreated} />}

    {/* Modal de Mis Reservaciones */}
    {showMyReservations && (
      <div className="modal-overlay" onClick={() => setShowMyReservations(false)}>
        <div className="auth-card" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={() => setShowMyReservations(false)}>&times;</button>
          <div className="auth-header">
            <h1>Mis Últimas Reservaciones</h1>
            <p>Tus reservaciones más recientes</p>
          </div>
          <div className="modal-content">
            {allReservations.length === 0 && allRoomReservations.length === 0 ? (
              <div className="empty-state">
                <p>No tienes reservaciones</p>
              </div>
            ) : (
              <div className="reservations-list">
                {/* Reservaciones de Comedor */}
                {allReservations.slice(0, 5).map((reservation) => (
                  <div key={`comedor-${reservation.id}`} className="reservation-card">
                    <div className="reservation-info">
                      <div className="reservation-time">
                        <span className="time-icon"><ClockIcon size={20} color="#667eea" /></span>
                        <span className="time-text">{reservation.timeRange}</span>
                      </div>
                      <div className="reservation-date">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <CalendarIcon size={18} color="#718096" /> 
                          {formatDate(reservation.date)} - Comedor
                        </span>
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
                {/* Reservaciones de Sala */}
                {allRoomReservations.slice(0, 5).map((reservation) => (
                  <div key={`sala-${reservation.id}`} className="reservation-card">
                    <div className="reservation-info">
                      <div className="reservation-time">
                        <span className="time-icon"><ClockIcon size={20} color="#667eea" /></span>
                        <span className="time-text">{reservation.timeRange}</span>
                      </div>
                      <div className="reservation-date">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <CalendarIcon size={18} color="#718096" /> 
                          {formatDate(reservation.date)} - Sala de Juntas
                        </span>
                      </div>
                    </div>
                    <span className={`reservation-status ${
                      reservation.status === 'Active' ? 'status-active' :
                      reservation.status === 'InProgress' ? 'status-inprogress' :
                      reservation.status === 'Cancelled' ? 'status-cancelled' : 'status-expired'
                    }`}>
                      {reservation.status === 'Active' ? 'Activa' :
                       reservation.status === 'InProgress' ? 'En Curso' :
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
            <p>Reservaciones activas o en curso</p>
          </div>
          <div className="modal-content">
            {allReservations.filter(r => r.status === 'Active' || r.status === 'InProgress').length === 0 && 
             allRoomReservations.filter(r => r.status === 'Active' || r.status === 'InProgress').length === 0 ? (
              <div className="empty-state">
                <p>No tienes reservaciones pendientes</p>
              </div>
            ) : (
              <div className="reservations-list">
                {/* Reservaciones de Comedor Pendientes */}
                {allReservations.filter(r => r.status === 'Active' || r.status === 'InProgress').map((reservation) => (
                  <div key={`comedor-${reservation.id}`} className="reservation-card">
                    <div className="reservation-info">
                      <div className="reservation-time">
                        <span className="time-icon"><ClockIcon size={20} color="#667eea" /></span>
                        <span className="time-text">{reservation.timeRange}</span>
                      </div>
                      <div className="reservation-date">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <CalendarIcon size={18} color="#718096" /> 
                          {formatDate(reservation.date)} - Comedor
                        </span>
                      </div>
                    </div>
                    <span className="reservation-status status-pending">Pendiente</span>
                  </div>
                ))}
                {/* Reservaciones de Sala Pendientes */}
                {allRoomReservations.filter(r => r.status === 'Active' || r.status === 'InProgress').map((reservation) => (
                  <div key={`sala-${reservation.id}`} className="reservation-card">
                    <div className="reservation-info">
                      <div className="reservation-time">
                        <span className="time-icon"><ClockIcon size={20} color="#667eea" /></span>
                        <span className="time-text">{reservation.timeRange}</span>
                      </div>
                      <div className="reservation-date">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <CalendarIcon size={18} color="#718096" /> 
                          {formatDate(reservation.date)} - Sala de Juntas
                        </span>
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
            {allReservations.filter(r => r.status === 'Cancelled' || r.status === 'Expired').length === 0 &&
             allRoomReservations.filter(r => r.status === 'Cancelled' || r.status === 'Expired').length === 0 ? (
              <div className="empty-state">
                <p>No hay reservaciones en el historial</p>
              </div>
            ) : (
              <div className="reservations-list">
                {/* Reservaciones de Comedor Completadas */}
                {allReservations.filter(r => r.status === 'Cancelled' || r.status === 'Expired').map((reservation) => (
                  <div key={`comedor-${reservation.id}`} className="reservation-card">
                    <div className="reservation-info">
                      <div className="reservation-time">
                        <span className="time-icon"><ClockIcon size={20} color="#667eea" /></span>
                        <span className="time-text">{reservation.timeRange}</span>
                      </div>
                      <div className="reservation-date">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <CalendarIcon size={18} color="#718096" /> 
                          {formatDate(reservation.date)} - Comedor
                        </span>
                      </div>
                    </div>
                    <span className={`reservation-status ${reservation.status === 'Cancelled' ? 'status-cancelled' : 'status-expired'}`}>
                      {reservation.status === 'Cancelled' ? 'Cancelada' : 'Expirada'}
                    </span>
                  </div>
                ))}
                {/* Reservaciones de Sala Completadas */}
                {allRoomReservations.filter(r => r.status === 'Cancelled' || r.status === 'Expired').map((reservation) => (
                  <div key={`sala-${reservation.id}`} className="reservation-card">
                    <div className="reservation-info">
                      <div className="reservation-time">
                        <span className="time-icon"><ClockIcon size={20} color="#667eea" /></span>
                        <span className="time-text">{reservation.timeRange}</span>
                      </div>
                      <div className="reservation-date">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <CalendarIcon size={18} color="#718096" /> 
                          {formatDate(reservation.date)} - Sala de Juntas
                        </span>
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
    
    {showChangePassword && <ChangePassword onClose={() => setShowChangePassword(false)} />}
    </>
  );
};

export default ReservHome;
