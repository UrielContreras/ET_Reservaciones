import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import '../Styles/Reserv_home.css';
import Register from './Register';
import CreateReserv from './Create_reserv';
import CreateRoomReserv from './Create_room_reserv';
import UpdateUsers from './Update_users';
import ChangePassword from './ChangePassword';
import { ChartIcon, UsersIcon, PlusIcon, TrashIcon, EditIcon, BriefcaseIcon, CalendarIcon, ClockIcon } from '../components/Icons';


interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  area: string;
  role: string;
}

interface Reservation {
  id: number;
  date: string;
  timeRange: string;
  status: string;
  userName: string;
  email: string;
  area: string;
  type?: 'comedor' | 'sala';
}

interface RoomReservation {
  id: number;
  date: string;
  timeRange: string;
  status: string;
  userName: string;
  email: string;
  area: string;
}

interface AdminReservation {
  id: number;
  date: string;
  timeSlotId: number;
  timeRange: string;
  status: string;
}

const HomeAdmin = () => {
  const [showRegister, setShowRegister] = useState(false);
  const [showCreateReserv, setShowCreateReserv] = useState(false);
  const [showCreateRoomReserv, setShowCreateRoomReserv] = useState(false);
  const [showReservationTypeModal, setShowReservationTypeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateUser, setShowUpdateUser] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: number; name: string } | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [roomReservations, setRoomReservations] = useState<RoomReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [activeTab, setActiveTab] = useState<'reservations' | 'users'>('reservations');
  const [reservationFilter, setReservationFilter] = useState<'all' | 'admin'>('all');
  const [userName, setUserName] = useState<string>('');
  const [myAdminReservations, setMyAdminReservations] = useState<AdminReservation[]>([]);
  const [myAdminRoomReservations, setMyAdminRoomReservations] = useState<RoomReservation[]>([]);
  const [loadingAdminReservations, setLoadingAdminReservations] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Función para formatear fecha sin problemas de zona horaria
  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString('es-MX');
  };

  // Función para obtener días del mes
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  // Función para obtener reservaciones de un día específico (Admin)
  const getReservationsForDate = (dateString: string) => {
    const comedorReservs = myAdminReservations.filter(r => r.date === dateString);
    const salaReservs = myAdminRoomReservations.filter(r => r.date === dateString);
    return { comedor: comedorReservs, sala: salaReservs };
  };

  // Función para obtener todas las reservaciones de un día específico (Todos los usuarios)
  const getAllReservationsForDate = (dateString: string) => {
    const comedorReservs = reservations.filter(r => r.date === dateString);
    const salaReservs = roomReservations.filter(r => r.date === dateString);
    return { comedor: comedorReservs, sala: salaReservs };
  };

  // Función para formatear fecha a YYYY-MM-DD
  const formatDateToString = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Función para obtener la fecha de hoy en formato YYYY-MM-DD
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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

  const loadReservations = useCallback(async () => {
    try {
      setLoadingReservations(true);
      const response = await axios.get(`${API_BASE_URL}/api/reservations/all`);
      // Cargar todas las reservaciones para el calendario
      setReservations(response.data);
    } catch (error) {
      console.error('Error al cargar reservaciones:', error);
    } finally {
      setLoadingReservations(false);
    }
  }, []);

  const loadRoomReservations = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/api/roomreservations/all`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      // Cargar todas las reservaciones de sala para el calendario
      setRoomReservations(response.data);
    } catch (error) {
      console.error('Error al cargar reservaciones de sala:', error);
    }
  }, []);

  const loadUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/api/profile/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setUserName(response.data.firstName);
    } catch (error) {
      console.error('Error al cargar perfil del usuario:', error);
    }
  };

  const loadAdminReservations = async () => {
    try {
      setLoadingAdminReservations(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('[ADMIN] No hay token');
        return;
      }

      // Primero, verificar el rol del usuario
      try {
        const debugResponse = await axios.get(`${API_BASE_URL}/api/reservations/debug-user`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('[ADMIN] Info de usuario:', debugResponse.data);
      } catch (err) {
        console.error('[ADMIN] Error al obtener info del usuario:', err);
      }

      console.log('[ADMIN] Llamando a /api/reservations/my-reservations...');
      const response = await axios.get(`${API_BASE_URL}/api/reservations/my-reservations`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('[ADMIN] Reservaciones recibidas:', response.data);
      console.log('[ADMIN] Cantidad de reservaciones:', response.data.length);
      setMyAdminReservations(response.data);

      // Cargar también las reservaciones de sala del admin
      try {
        const roomResponse = await axios.get(`${API_BASE_URL}/api/roomreservations/my-reservations`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log('[ADMIN] Reservaciones de sala recibidas:', roomResponse.data);
        setMyAdminRoomReservations(roomResponse.data);
      } catch (roomErr) {
        console.error('[ADMIN] Error al cargar reservaciones de sala:', roomErr);
      }
    } catch (error: unknown) {
      console.error('[ADMIN] Error al cargar reservaciones:', error);
      if (axios.isAxiosError(error)) {
        console.error('[ADMIN] Status:', error.response?.status);
        console.error('[ADMIN] Data:', error.response?.data);
        if (error.response?.status === 403) {
          console.error('[ADMIN] Error 403: No tienes permisos. Necesitas cerrar sesión y volver a iniciar sesión.');
        }
      }
    } finally {
      setLoadingAdminReservations(false);
    }
  };

  const handleCancelAdminReservation = async (id: number) => {
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
      loadAdminReservations();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data) {
        alert(err.response.data);
      } else {
        alert('Error al cancelar la reservación');
      }
      console.error('Error al cancelar reservación:', err);
    }
  };

  const handleCancelAdminRoomReservation = async (id: number) => {
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
      loadAdminReservations();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data) {
        alert(err.response.data);
      } else {
        alert('Error al cancelar la reservación de sala');
      }
      console.error('Error al cancelar reservación de sala:', err);
    }
  };

  useEffect(() => {
    loadUsers();
    loadReservations();
    loadRoomReservations();
    loadUserProfile();
    loadAdminReservations();
  }, [loadReservations, loadRoomReservations]);

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

  const handleRegisterClose = () => {
    setShowRegister(false);
    loadUsers(); // Recargar usuarios después de crear uno nuevo
  };

  const handleCreateReservClose = () => {
    setShowCreateReserv(false);
    loadReservations(); // Recargar reservaciones después de crear una nueva
    loadAdminReservations(); // Recargar también las reservaciones del admin
  };

  const handleCreateRoomReservClose = () => {
    setShowCreateRoomReserv(false);
    loadRoomReservations(); // Recargar reservaciones de sala después de crear una nueva
    loadAdminReservations(); // Recargar también las reservaciones del admin
  };

  const handleReservationTypeSelect = (type: 'comedor' | 'sala') => {
    setShowReservationTypeModal(false);
    if (type === 'comedor') {
      setShowCreateReserv(true);
    } else {
      setShowCreateRoomReserv(true);
    }
  };

  const handleDeleteUser = (userId: number, userName: string) => {
    setUserToDelete({ id: userId, name: userName });
    setShowDeleteModal(true);
  };

  const handleEditUser = (user: User) => {
    setUserToEdit(user);
    setShowUpdateUser(true);
  };

  const handleUpdateUserClose = () => {
    setShowUpdateUser(false);
    setUserToEdit(null);
    loadUsers(); // Recargar usuarios después de actualizar
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      const response = await axios.delete(`${API_BASE_URL}/api/users/${userToDelete.id}`);
      console.log('Usuario eliminado exitosamente:', response.data);
      setShowDeleteModal(false);
      setUserToDelete(null);
      loadUsers(); // Recargar la lista de usuarios
    } catch (error: unknown) {
      console.error('Error completo al dar de baja usuario:', error);
      if (axios.isAxiosError(error)) {
        console.error('Respuesta del servidor:', error.response?.data);
        console.error('Status:', error.response?.status);
        const errorMessage = error.response?.data?.message || error.response?.data || 'Error al dar de baja el usuario. Por favor intenta de nuevo.';
        alert(`Error: ${errorMessage}`);
      } else {
        alert('Error al dar de baja el usuario. Por favor intenta de nuevo.');
      }
    }
  };
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  return (
    <>
    <div className="reserv-container">
      <nav className="reserv-navbar">
        <div className="nav-brand">
          <h2> Reservaciones - Panel Admin</h2>
        </div>
        <div className="nav-user">
          <span
            className="admin-badge"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#ffffff', 
              padding: '6px 10px',
              borderRadius: '6px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <BriefcaseIcon size={18} color="#ffffff" /> Bienvenid@ {userName}
          </span>
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
          <h1>Panel de Administración</h1>
          <p>Gestiona todas las reservaciones y usuarios del sistema</p>
        </header>

        {/* Dashboard Cards */}
        <div className="reserv-dashboard">
          <div className="dashboard-card">
            <div className="card-icon"><ChartIcon size={32} color="#667eea" /></div>
            <h3>Reservaciones de Hoy</h3>
            <p className="card-number">{
              reservations.filter(r => r.date === getTodayDate()).length + 
              roomReservations.filter(r => r.date === getTodayDate()).length
            }</p>
            <button className="btn-card" onClick={() => setActiveTab('reservations')}>Ver todas</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon"><UsersIcon size={32} color="#667eea" /></div>
            <h3>Total de Usuarios</h3>
            <p className="card-number">{users.length}</p>
            <button className="btn-card" onClick={() => setActiveTab('users')}>Gestionar</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon"><PlusIcon size={32} color="#667eea" /></div>
            <h3>Nuevo Usuario</h3>
            <p className="card-text">Crear usuario manualmente</p>
            <button className="btn-card primary" onClick={() => setShowRegister(true)}>Crear</button>
          </div>
          <div className="dashboard-card">
            <div className="card-icon"><PlusIcon size={32} color="#667eea" /></div>
            <h3>Nueva Reservacion</h3>
            <p className="card-text">Crea una nueva reservación</p>
            <button className="btn-card primary" onClick={() => setShowReservationTypeModal(true)}>Crear</button>
          </div>
        </div>

        {/* Tabs de Navegación */}
        <div style={{
          display: 'flex',
          gap: '0',
          marginTop: '2rem',
          marginBottom: '1.5rem',
          borderBottom: '2px solid #e2e8f0'
        }}>
          
         
        </div>

        {/* Contenido de Reservaciones */}
        {activeTab === 'reservations' && (
          <>
            {/* Filtros de Reservaciones */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '1.5rem',
              padding: '1rem',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <button
                onClick={() => setReservationFilter('all')}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  border: reservationFilter === 'all' ? '2px solid #667eea' : '2px solid #e2e8f0',
                  background: reservationFilter === 'all' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                  color: reservationFilter === 'all' ? 'white' : '#2d3748',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease'
                }}
              >
                Todas las Reservaciones
              </button>
              <button
                onClick={() => setReservationFilter('admin')}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  border: reservationFilter === 'admin' ? '2px solid #667eea' : '2px solid #e2e8f0',
                  background: reservationFilter === 'admin' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                  color: reservationFilter === 'admin' ? 'white' : '#2d3748',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease'
                }}
              >
                Mis Reservaciones
              </button>
            </div>

            {/* Contenido según filtro */}
            {reservationFilter === 'admin' ? (
              // Calendario de Mis Reservaciones
              <section className="recent-section">
                <h2>Mis Reservaciones</h2>
                
                {/* Controles del Calendario */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '12px',
                  color: 'white'
                }}>
                  <button
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.5rem 1rem',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: '600',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                  >
                    ← Anterior
                  </button>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
                    {currentDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }).toUpperCase()}
                  </h3>
                  <button
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.5rem 1rem',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: '600',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                  >
                    Siguiente →
                  </button>
                </div>

                {loadingAdminReservations ? (
                  <div className="empty-state">
                    <p>Cargando...</p>
                  </div>
                ) : (
                  <>
                    {/* Calendario */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      gap: '8px',
                      marginBottom: '2rem'
                    }}>
                      {/* Encabezados de días */}
                      {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                        <div key={day} style={{
                          textAlign: 'center',
                          fontWeight: '700',
                          padding: '0.75rem',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          borderRadius: '8px',
                          fontSize: '0.9rem'
                        }}>
                          {day}
                        </div>
                      ))}
                      
                      {/* Días del mes */}
                      {(() => {
                        const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
                        const days = [];
                        
                        // Espacios vacíos antes del primer día
                        for (let i = 0; i < startingDayOfWeek; i++) {
                          days.push(<div key={`empty-${i}`} />);
                        }
                        
                        // Días del mes
                        for (let day = 1; day <= daysInMonth; day++) {
                          const dateString = formatDateToString(year, month, day);
                          const { comedor, sala } = getReservationsForDate(dateString);
                          const hasReservations = comedor.length > 0 || sala.length > 0;
                          const today = new Date();
                          const isToday = today.getDate() === day && 
                                         today.getMonth() === month && 
                                         today.getFullYear() === year;
                          
                          days.push(
                            <div
                              key={day}
                              onClick={() => setSelectedDate(selectedDate === dateString ? null : dateString)}
                              style={{
                                minHeight: '80px',
                                padding: '0.5rem',
                                border: isToday ? '3px solid #667eea' : '2px solid #e2e8f0',
                                borderRadius: '12px',
                                cursor: hasReservations ? 'pointer' : 'default',
                                background: hasReservations 
                                  ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                                  : 'white',
                                transition: 'all 0.3s ease',
                                position: 'relative',
                                boxShadow: selectedDate === dateString ? '0 4px 12px rgba(102, 126, 234, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)'
                              }}
                              onMouseOver={(e) => {
                                if (hasReservations) {
                                  e.currentTarget.style.transform = 'translateY(-2px)';
                                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)';
                                }
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = selectedDate === dateString 
                                  ? '0 4px 12px rgba(102, 126, 234, 0.3)' 
                                  : '0 1px 3px rgba(0,0,0,0.1)';
                              }}
                            >
                              <div style={{ 
                                fontWeight: isToday ? '700' : '600', 
                                marginBottom: '0.25rem',
                                color: isToday ? '#667eea' : '#2d3748',
                                fontSize: '1.1rem'
                              }}>
                                {day}
                              </div>
                              {hasReservations && (
                                <div style={{ fontSize: '0.7rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  {comedor.length > 0 && (
                                    <div style={{
                                      background: '#667eea',
                                      color: 'white',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      fontWeight: '600'
                                    }}>
                                      🍽️ {comedor.length}
                                    </div>
                                  )}
                                  {sala.length > 0 && (
                                    <div style={{
                                      background: '#764ba2',
                                      color: 'white',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      fontWeight: '600'
                                    }}>
                                      🏢 {sala.length}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        }
                        
                        return days;
                      })()}
                    </div>

                    {/* Detalle de reservaciones del día seleccionado */}
                    {selectedDate && (() => {
                      const { comedor, sala } = getReservationsForDate(selectedDate);
                      return (
                        <div style={{
                          background: 'white',
                          border: '2px solid #667eea',
                          borderRadius: '12px',
                          padding: '1.5rem',
                          marginTop: '1rem',
                          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)'
                        }}>
                          <h3 style={{ 
                            marginTop: 0, 
                            marginBottom: '1rem',
                            color: '#667eea',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            <CalendarIcon size={24} color="#667eea" />
                            Reservaciones del {formatDate(selectedDate)}
                          </h3>
                          
                          {comedor.length === 0 && sala.length === 0 ? (
                            <p style={{ color: '#718096' }}>No hay reservaciones para este día</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              {/* Reservaciones de Comedor */}
                              {comedor.map((reservation) => (
                                <div key={`comedor-${reservation.id}`} className="reservation-card">
                                  <div className="reservation-info">
                                    <div className="reservation-time">
                                      <span className="time-icon"><ClockIcon size={20} color="#667eea" /></span>
                                      <span className="time-text">{reservation.timeRange}</span>
                                    </div>
                                    <div className="reservation-date">
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#667eea', fontWeight: '600' }}>
                                         Comedor
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
                                        onClick={() => handleCancelAdminReservation(reservation.id)}
                                      >
                                        Cancelar
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                              
                              {/* Reservaciones de Sala */}
                              {sala.map((reservation) => (
                                <div key={`sala-${reservation.id}`} className="reservation-card">
                                  <div className="reservation-info">
                                    <div className="reservation-time">
                                      <span className="time-icon"><ClockIcon size={20} color="#764ba2" /></span>
                                      <span className="time-text">{reservation.timeRange}</span>
                                    </div>
                                    <div className="reservation-date">
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#764ba2', fontWeight: '600' }}>
                                         Sala de Juntas
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
                                        onClick={() => handleCancelAdminRoomReservation(reservation.id)}
                                      >
                                        Cancelar
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {myAdminReservations.length === 0 && myAdminRoomReservations.length === 0 && (
                      <div className="empty-state" style={{ marginTop: '2rem' }}>
                        <p>No tienes reservaciones</p>
                        <span>Crea una nueva reservación para comenzar</span>
                      </div>
                    )}
                  </>
                )}
              </section>
            ) : (
              // Calendario de Todas las Reservaciones
              <section className="recent-section">
                <h2>Todas las Reservaciones</h2>
                
                {/* Controles del Calendario */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '12px',
                  color: 'white'
                }}>
                  <button
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.5rem 1rem',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: '600',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                  >
                    ← Anterior
                  </button>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
                    {currentDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }).toUpperCase()}
                  </h3>
                  <button
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.5rem 1rem',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: '600',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                  >
                    Siguiente →
                  </button>
                </div>

                {loadingReservations ? (
                  <div className="empty-state">
                    <p>Cargando...</p>
                  </div>
                ) : (
                  <>
                    {/* Calendario */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      gap: '8px',
                      marginBottom: '2rem'
                    }}>
                      {/* Encabezados de días */}
                      {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                        <div key={day} style={{
                          textAlign: 'center',
                          fontWeight: '700',
                          padding: '0.75rem',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          borderRadius: '8px',
                          fontSize: '0.9rem'
                        }}>
                          {day}
                        </div>
                      ))}
                      
                      {/* Días del mes */}
                      {(() => {
                        const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
                        const days = [];
                        
                        // Espacios vacíos antes del primer día
                        for (let i = 0; i < startingDayOfWeek; i++) {
                          days.push(<div key={`empty-${i}`} />);
                        }
                        
                        // Días del mes
                        for (let day = 1; day <= daysInMonth; day++) {
                          const dateString = formatDateToString(year, month, day);
                          const { comedor, sala } = getAllReservationsForDate(dateString);
                          const hasReservations = comedor.length > 0 || sala.length > 0;
                          const today = new Date();
                          const isToday = today.getDate() === day && 
                                         today.getMonth() === month && 
                                         today.getFullYear() === year;
                          
                          days.push(
                            <div
                              key={day}
                              onClick={() => setSelectedDate(selectedDate === dateString ? null : dateString)}
                              style={{
                                minHeight: '80px',
                                padding: '0.5rem',
                                border: isToday ? '3px solid #667eea' : '2px solid #e2e8f0',
                                borderRadius: '12px',
                                cursor: hasReservations ? 'pointer' : 'default',
                                background: hasReservations 
                                  ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                                  : 'white',
                                transition: 'all 0.3s ease',
                                position: 'relative',
                                boxShadow: selectedDate === dateString ? '0 4px 12px rgba(102, 126, 234, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)'
                              }}
                              onMouseOver={(e) => {
                                if (hasReservations) {
                                  e.currentTarget.style.transform = 'translateY(-2px)';
                                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)';
                                }
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = selectedDate === dateString 
                                  ? '0 4px 12px rgba(102, 126, 234, 0.3)' 
                                  : '0 1px 3px rgba(0,0,0,0.1)';
                              }}
                            >
                              <div style={{ 
                                fontWeight: isToday ? '700' : '600', 
                                marginBottom: '0.25rem',
                                color: isToday ? '#667eea' : '#2d3748',
                                fontSize: '1.1rem'
                              }}>
                                {day}
                              </div>
                              {hasReservations && (
                                <div style={{ fontSize: '0.7rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  {comedor.length > 0 && (
                                    <div style={{
                                      background: '#667eea',
                                      color: 'white',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      fontWeight: '600'
                                    }}>
                                      🍽️ {comedor.length}
                                    </div>
                                  )}
                                  {sala.length > 0 && (
                                    <div style={{
                                      background: '#764ba2',
                                      color: 'white',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      fontWeight: '600'
                                    }}>
                                      🏢 {sala.length}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        }
                        
                        return days;
                      })()}
                    </div>

                    {/* Detalle de reservaciones del día seleccionado */}
                    {selectedDate && (() => {
                      const { comedor, sala } = getAllReservationsForDate(selectedDate);
                      return (
                        <div style={{
                          background: 'white',
                          border: '2px solid #667eea',
                          borderRadius: '12px',
                          padding: '1.5rem',
                          marginTop: '1rem',
                          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)'
                        }}>
                          <h3 style={{ 
                            marginTop: 0, 
                            marginBottom: '1rem',
                            color: '#667eea',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            <CalendarIcon size={24} color="#667eea" />
                            Reservaciones del {formatDate(selectedDate)}
                          </h3>
                          
                          {comedor.length === 0 && sala.length === 0 ? (
                            <p style={{ color: '#718096' }}>No hay reservaciones para este día</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              {/* Reservaciones de Comedor */}
                              {comedor.map((reservation) => (
                                <div key={`comedor-${reservation.id}`} className="reservation-card">
                                  <div className="reservation-info">
                                    <div className="reservation-time">
                                      <span className="time-icon"><ClockIcon size={20} color="#667eea" /></span>
                                      <span className="time-text">{reservation.timeRange}</span>
                                    </div>
                                    <div className="reservation-date">
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#667eea', fontWeight: '600' }}>
                                        🍽️ Comedor - {reservation.userName}
                                      </span>
                                      <span style={{ fontSize: '0.85rem', color: '#718096' }}>
                                        {reservation.email} · {reservation.area || 'N/A'}
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
                                       reservation.status === 'Cancelled' ? 'Cancelada' : 
                                       reservation.status === 'Expired' ? 'Expirada' : 
                                       reservation.status === 'Completed' ? 'Completada' : reservation.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                              
                              {/* Reservaciones de Sala */}
                              {sala.map((reservation) => (
                                <div key={`sala-${reservation.id}`} className="reservation-card">
                                  <div className="reservation-info">
                                    <div className="reservation-time">
                                      <span className="time-icon"><ClockIcon size={20} color="#764ba2" /></span>
                                      <span className="time-text">{reservation.timeRange}</span>
                                    </div>
                                    <div className="reservation-date">
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#764ba2', fontWeight: '600' }}>
                                        🏢 Sala de Juntas - {reservation.userName}
                                      </span>
                                      <span style={{ fontSize: '0.85rem', color: '#718096' }}>
                                        {reservation.email} · {reservation.area || 'N/A'}
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
                                       reservation.status === 'Cancelled' ? 'Cancelada' : 
                                       reservation.status === 'Expired' ? 'Expirada' : 
                                       reservation.status === 'Completed' ? 'Completada' : reservation.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {reservations.length === 0 && roomReservations.length === 0 && (
                      <div className="empty-state" style={{ marginTop: '2rem' }}>
                        <p>No hay reservaciones</p>
                        <span>Las reservaciones aparecerán aquí</span>
                      </div>
                    )}
                  </>
                )}
              </section>
            )}
          </>
        )}

        {/* Contenido de Usuarios */}
        {activeTab === 'users' && (
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
                      <th>Acciones</th>
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
                        <td>
                          <button 
                            className="btn-edit"
                            onClick={() => handleEditUser(user)}
                            title="Editar usuario"
                            style={{ marginRight: '8px' }}
                          >
                            <EditIcon size={18} color="white" />
                          </button>
                          <button 
                            className="btn-delete"
                            onClick={() => handleDeleteUser(user.id, `${user.firstName} ${user.lastName}`)}
                            title="Dar de baja usuario"
                          >
                            <TrashIcon size={18} color="white" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
    {showRegister && <Register onClose={handleRegisterClose} />}
    {showCreateReserv && <CreateReserv onClose={handleCreateReservClose} />}
    {showCreateRoomReserv && <CreateRoomReserv onClose={handleCreateRoomReservClose} />}
    {showUpdateUser && userToEdit && <UpdateUsers onClose={handleUpdateUserClose} user={userToEdit} />}
    {showChangePassword && <ChangePassword onClose={() => setShowChangePassword(false)} />}
    
    {/* Modal de Selección de Tipo de Reservación */}
    {showReservationTypeModal && (
      <div className="modal-overlay" onClick={() => setShowReservationTypeModal(false)}>
        <div className="auth-card" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={() => setShowReservationTypeModal(false)}>&times;</button>
          <div className="auth-header">
            <h1>Seleccionar Tipo de Reservación</h1>
            <p>Elige el tipo de reservación que deseas crear</p>
          </div>

          <div className="auth-form" style={{ gap: '1rem' }}>
            <button 
              onClick={() => handleReservationTypeSelect('comedor')}
              className="btn-card primary"
              style={{ 
                width: '100%', 
                padding: '1rem',
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              Comedor
            </button>
            
            <button 
              onClick={() => handleReservationTypeSelect('sala')}
              className="btn-card primary"
              style={{ 
                width: '100%', 
                padding: '1rem',
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
             Sala de Juntas
            </button>
          </div>
        </div>
      </div>
    )}
    
    {showDeleteModal && userToDelete && (
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && cancelDelete()}>
        <div className="auth-card">
          <button className="modal-close" onClick={cancelDelete}>&times;</button>
          <div className="auth-header">
            <h1> Confirmar Eliminación</h1>
            <p>Esta acción no se puede deshacer</p>
          </div>

          <div className="auth-form">
            <div className="confirmation-message">
              <p>¿Estás seguro de que deseas dar de baja al usuario?</p>
              <div className="user-info-delete">
                <strong>{userToDelete.name}</strong>
              </div>
              <p className="warning-text">Esta acción desactivará permanentemente la cuenta del usuario.</p>
            </div>

            <div className="button-group">
              <button onClick={cancelDelete} className="btn-secondary">
                Cancelar
              </button>
              <button onClick={confirmDelete} className="btn-danger">
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default HomeAdmin;
