import { useState, useEffect } from 'react';
import * as userService from '../services/userService';
import '../Styles/Reserv_home.css';
import Register from './Register';
import CreateReserv from './Create_reserv';
import CreateRoomReserv from './Create_room_reserv';
import UpdateUsers from './Update_users';
import ChangePassword from './ChangePassword';
import { ChartIcon, UsersIcon, PlusIcon, TrashIcon, EditIcon, BriefcaseIcon, CalendarIcon, ClockIcon, SearchIcon, LoaderIcon, InfoIcon, UserIcon, DishIcon, BuildingIcon } from '../components/Icons';
import { getColorFromId, formatDate, getDaysInMonth, 
        formatDateToString, getTodayDate} from '../utils/Functions';
import { useUserManagement } from '../hooks/useUserManagement';
import { useReservationFilters } from '../hooks/useReservationFilters';
import { useReservations } from '../hooks/useReservations';
import { useRoomReservations } from '../hooks/useRoomReservations';
import type { User, Reservation, RoomReservation } from '../types';


const HomeAdmin = () => {
  // Hook personalizado para gestión de usuarios
  const {
    users,
    loading: loadingUsers,
    filteredUsers,
    userSearchTerm,
    setUserSearchTerm,
    userSortColumn,
    userSortDirection,
    handleUserSort,
    deleteModal,
    openDeleteModal,
    confirmDelete,
    cancelDelete,
    userToEdit,
    showUpdateUser,
    editUser,
    closeUpdateUser,
    loadUsers
  } = useUserManagement();

  // Hook personalizado para filtros de reservaciones
  const {
    reservationSearchTerm,
    setReservationSearchTerm,
    reservationStatusFilter,
    setReservationStatusFilter,
    reservationTypeFilter,
    setReservationTypeFilter,
    reservationFilter,
    setReservationFilter,
    currentDate,
    selectedDate,
    clearFilters,
    hasActiveFilters,
    goToPreviousMonth,
    goToNextMonth,
    toggleDateSelection
  } = useReservationFilters();

  // Hook personalizado para gestión de reservaciones del comedor
  const {
    reservations,
    myAdminReservations,
    loadingReservations,
    loadingAdminReservations,
    loadReservations,
    loadAdminReservations,
    handleCancelAdminReservation,
    getFilteredReservationsForDate: getFilteredComedorReservations
  } = useReservations();

  // Hook personalizado para gestión de reservaciones de salas
  const {
    roomReservations,
    myAdminRoomReservations,
    showRescheduleModal,
    setShowRescheduleModal,
    reservationToReschedule,
    rescheduleDate,
    setRescheduleDate,
    rescheduleStartTime,
    setRescheduleStartTime,
    rescheduleEndTime,
    setRescheduleEndTime,
    rescheduleError,
    setRescheduleError,
    checkingAvailability,
    loadRoomReservations,
    loadAdminRoomReservations,
    handleCancelAdminRoomReservation,
    handleCancelAnyRoomReservation,
    handleOpenReschedule,
    checkTimeAvailability,
    handleReschedule
  } = useRoomReservations();

  const [showRegister, setShowRegister] = useState(false);
  const [showCreateReserv, setShowCreateReserv] = useState(false);
  const [showCreateRoomReserv, setShowCreateRoomReserv] = useState(false);
  const [showReservationTypeModal, setShowReservationTypeModal] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'reservations' | 'users'>('reservations');
  const [userName, setUserName] = useState<string>('');

  // Función para filtrar reservaciones para el calendario (incluye salas)
  const getFilteredReservationsForDate = (dateString: string) => {
    let salaReservs = roomReservations.filter((r: RoomReservation) => r.date === dateString);

    // Aplicar filtro de búsqueda
    if (reservationSearchTerm) {
      const searchLower = reservationSearchTerm.toLowerCase();
      salaReservs = salaReservs.filter((r: RoomReservation) => 
        r.userName.toLowerCase().includes(searchLower) ||
        r.email.toLowerCase().includes(searchLower) ||
        (r.area?.toLowerCase() || '').includes(searchLower)
      );
    }

    // Aplicar filtro de estado
    if (reservationStatusFilter !== 'all') {
      salaReservs = salaReservs.filter((r: RoomReservation) => r.status === reservationStatusFilter);
    }

    // Obtener reservaciones de comedor filtradas desde el hook
    const comedorReservs = reservationTypeFilter === 'sala' 
      ? [] 
      : getFilteredComedorReservations(
          dateString, 
          reservationSearchTerm, 
          reservationStatusFilter, 
          reservationTypeFilter
        );

    if (reservationTypeFilter === 'comedor') {
      salaReservs = [];
    }

    return { comedor: comedorReservs, sala: salaReservs };
  };

  // Función para filtrar MIS reservaciones (del administrador actual)
  const getFilteredMyReservationsForDate = (dateString: string) => {
    let myComedorReservs = myAdminReservations.filter((r: Reservation) => r.date === dateString);
    let mySalaReservs = myAdminRoomReservations.filter((r: RoomReservation) => r.date === dateString);

    // Aplicar filtro de búsqueda
    if (reservationSearchTerm) {
      const searchLower = reservationSearchTerm.toLowerCase();
      
      myComedorReservs = myComedorReservs.filter((r: Reservation) => 
        r.userName.toLowerCase().includes(searchLower) ||
        r.email.toLowerCase().includes(searchLower)
      );

      mySalaReservs = mySalaReservs.filter((r: RoomReservation) => 
        r.userName.toLowerCase().includes(searchLower) ||
        r.email.toLowerCase().includes(searchLower) ||
        (r.area?.toLowerCase() || '').includes(searchLower)
      );
    }

    // Aplicar filtro de estado
    if (reservationStatusFilter !== 'all') {
      myComedorReservs = myComedorReservs.filter((r: Reservation) => r.status === reservationStatusFilter);
      mySalaReservs = mySalaReservs.filter((r: RoomReservation) => r.status === reservationStatusFilter);
    }

    // Aplicar filtro de tipo
    if (reservationTypeFilter === 'comedor') {
      mySalaReservs = [];
    } else if (reservationTypeFilter === 'sala') {
      myComedorReservs = [];
    }

    return { comedor: myComedorReservs, sala: mySalaReservs };
  };

  const loadUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const profile = await userService.getCurrentUserProfile();
      setUserName(profile.firstName);
    } catch (error) {
      console.error('Error al cargar perfil del usuario:', error);
    }
  };

  useEffect(() => {
    loadUsers();
    loadReservations();
    loadRoomReservations();
    loadUserProfile();
    loadAdminReservations();
    loadAdminRoomReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar el componente

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
    loadAdminRoomReservations(); // Recargar las reservaciones de sala del admin
  };

  const handleReservationTypeSelect = (type: 'comedor' | 'sala') => {
    setShowReservationTypeModal(false);
    if (type === 'comedor') {
      setShowCreateReserv(true);
    } else {
      setShowCreateRoomReserv(true);
    }
  };

  // Alias para mantener compatibilidad
  const handleUpdateUserClose = () => {
    closeUpdateUser();
    loadUsers();
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
              reservations.filter((r: Reservation) => r.date === getTodayDate()).length + 
              roomReservations.filter((r: RoomReservation) => r.date === getTodayDate()).length
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
            {/* Barra de búsqueda y filtros para reservaciones */}
            <div style={{
              marginBottom: '1rem',
              padding: '1.5rem',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: '1 1 300px' }}>
                  <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                    <SearchIcon size={20} color="#718096" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar por nombre, email o área..."
                    value={reservationSearchTerm}
                    onChange={(e) => setReservationSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 3rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.3s ease'
                  }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
                
                <select
                  value={reservationStatusFilter}
                  onChange={(e) => setReservationStatusFilter(e.target.value as 'all' | 'Active' | 'InProgress' | 'Cancelled' | 'Expired' | 'Completed')}
                  style={{
                    padding: '0.75rem 1rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    background: 'white',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  <option value="all">Todos los Estados</option>
                  <option value="Active">Activas</option>
                  <option value="InProgress">En Curso</option>
                  <option value="Cancelled">Canceladas</option>
                  <option value="Expired">Expiradas</option>
                  <option value="Completed">Completadas</option>
                </select>

                <select
                  value={reservationTypeFilter}
                  onChange={(e) => setReservationTypeFilter(e.target.value as 'all' | 'comedor' | 'sala')}
                  style={{
                    padding: '0.75rem 1rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    background: 'white',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  <option value="all">Todos los Tipos</option>
                  <option value="comedor">Comedor</option>
                  <option value="sala">Sala de Juntas</option>
                </select>

                {hasActiveFilters() && (
                  <button
                    onClick={clearFilters}
                    style={{
                      padding: '0.75rem 1rem',
                      background: '#f56565',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '1rem',
                      transition: 'background 0.3s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#e53e3e'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#f56565'}
                  >
                    Limpiar Filtros
                  </button>
                )}
              </div>
            </div>

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
                    onClick={goToPreviousMonth}
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
                    onClick={goToNextMonth}
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
                    {/* Contenedor scrollable del Calendario */}
                    <div style={{
                      overflowX: 'auto',
                      overflowY: 'hidden',
                      WebkitOverflowScrolling: 'touch',
                      marginBottom: '2rem'
                    }}>
                      {/* Calendario */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gap: '4px',
                        minWidth: '100%'
                      }}>
                      {/* Encabezados de días */}
                      {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                        <div key={day} style={{
                          textAlign: 'center',
                          fontWeight: '700',
                          padding: '0.5rem 0.25rem',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          borderRadius: '6px',
                          fontSize: '0.75rem'
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
                          const { comedor, sala } = getFilteredMyReservationsForDate(dateString);
                          const hasReservations = comedor.length > 0 || sala.length > 0;
                          const today = new Date();
                          const isToday = today.getDate() === day && 
                                         today.getMonth() === month && 
                                         today.getFullYear() === year;
                          
                          days.push(
                            <div
                              key={day}
                              onClick={() => toggleDateSelection(dateString)}
                              style={{
                                minHeight: '60px',
                                padding: '0.35rem',
                                border: isToday ? '2px solid #667eea' : '1px solid #e2e8f0',
                                borderRadius: '8px',
                                cursor: hasReservations ? 'pointer' : 'default',
                                background: hasReservations 
                                  ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                                  : 'white',
                                transition: 'all 0.3s ease',
                                position: 'relative',
                                boxShadow: selectedDate === dateString ? '0 4px 12px rgba(102, 126, 234, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
                                display: 'flex',
                                flexDirection: 'column'
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
                                marginBottom: '0.15rem',
                                color: isToday ? '#667eea' : '#2d3748',
                                fontSize: '0.9rem'
                              }}>
                                {day}
                              </div>
                              {hasReservations && (() => {
                                const totalReservations = [
                                  ...comedor.map((r: Reservation) => ({ ...r, resType: 'comedor' as const })),
                                  ...sala.map((r: RoomReservation) => ({ ...r, resType: 'sala' as const }))
                                ];
                                const maxBars = 3;
                                const barsToShow = totalReservations.slice(0, maxBars);
                                const remainingCount = totalReservations.length - maxBars;
                                
                                // Generar colores basados en el ID de cada reservación (estáticos)
                                const barColors = barsToShow.map(reservation => getColorFromId(reservation.id));
                                
                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: 'auto' }}>
                                    {barsToShow.map((reservation, index) => (
                                      <div
                                        key={index}
                                        style={{
                                          height: 'auto',
                                          minHeight: '18px',
                                          background: barColors[index],
                                          borderRadius: '4px',
                                          width: '100%',
                                          padding: '3px 6px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}
                                      >
                                        <span style={{
                                          fontSize: '0.65rem',
                                          color: 'white',
                                          fontWeight: '600',
                                          textAlign: 'center',
                                          lineHeight: '1.2',
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis'
                                        }}>
                                          {reservation.resType === 'comedor' 
                                            ? 'Comedor' 
                                            : (reservation.meetingName || 'Sala de Juntas')}
                                        </span>
                                      </div>
                                    ))}
                                    {remainingCount > 0 && (
                                      <div style={{
                                        fontSize: '0.6rem',
                                        color: '#667eea',
                                        fontWeight: '600',
                                        textAlign: 'center',
                                        marginTop: '2px'
                                      }}>
                                        +{remainingCount}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          );
                        }
                        
                        return days;
                      })()}
                      </div>
                    </div>

                    {/* Detalle de reservaciones del día seleccionado */}
                    {selectedDate && (() => {
                      const { comedor, sala } = getFilteredMyReservationsForDate(selectedDate);
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
                              {sala.map((reservation: RoomReservation) => (
                                <div key={`sala-${reservation.id}`} className="reservation-card">
                                  <div className="reservation-info">
                                    <div className="reservation-time">
                                      <span className="time-icon"><ClockIcon size={20} color="#764ba2" /></span>
                                      <span className="time-text">{reservation.timeRange}</span>
                                    </div>
                                    <div className="reservation-date">
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#764ba2', fontWeight: '600' }}>
                                         {reservation.meetingName || 'Sala de Juntas'}
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
                                    {reservation.status === 'Active' && (
                                      <>
                                        <button 
                                          className="btn-edit"
                                          onClick={() => handleOpenReschedule(reservation)}
                                          style={{ marginRight: '8px' }}
                                        >
                                          Reprogramar
                                        </button>
                                        <button 
                                          className="btn-cancel"
                                          onClick={() => handleCancelAdminRoomReservation(reservation.id, loadAdminReservations)}
                                        >
                                          Cancelar
                                        </button>
                                      </>
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
                    onClick={goToPreviousMonth}
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
                    onClick={goToNextMonth}
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
                    {/* Contenedor scrollable del Calendario */}
                    <div style={{
                      overflowX: 'auto',
                      overflowY: 'hidden',
                      WebkitOverflowScrolling: 'touch',
                      marginBottom: '2rem'
                    }}>
                      {/* Calendario */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gap: '4px',
                        minWidth: '100%'
                      }}>
                      {/* Encabezados de días */}
                      {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                        <div key={day} style={{
                          textAlign: 'center',
                          fontWeight: '700',
                          padding: '0.5rem 0.25rem',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          borderRadius: '6px',
                          fontSize: '0.75rem'
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
                          const { comedor, sala } = getFilteredReservationsForDate(dateString);
                          const hasReservations = comedor.length > 0 || sala.length > 0;
                          const today = new Date();
                          const isToday = today.getDate() === day && 
                                         today.getMonth() === month && 
                                         today.getFullYear() === year;
                          
                          days.push(
                            <div
                              key={day}
                              onClick={() => toggleDateSelection(dateString)}
                              style={{
                                minHeight: '100px',
                                padding: '0.5rem',
                                border: isToday ? '2px solid #667eea' : '1px solid #e2e8f0',
                                borderRadius: '8px',
                                cursor: hasReservations ? 'pointer' : 'default',
                                background: hasReservations 
                                  ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                                  : 'white',
                                transition: 'all 0.3s ease',
                                position: 'relative',
                                boxShadow: selectedDate === dateString ? '0 4px 12px rgba(102, 126, 234, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
                                display: 'flex',
                                flexDirection: 'column'
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
                                marginBottom: '0.15rem',
                                color: isToday ? '#667eea' : '#2d3748',
                                fontSize: '0.9rem'
                              }}>
                                {day}
                              </div>
                              {hasReservations && (() => {
                                const totalReservations = [
                                  ...comedor.map((r: Reservation) => ({ ...r, resType: 'comedor' as const })),
                                  ...sala.map((r: RoomReservation) => ({ ...r, resType: 'sala' as const }))
                                ];
                                const maxBars = 3;
                                const barsToShow = totalReservations.slice(0, maxBars);
                                const remainingCount = totalReservations.length - maxBars;
                                
                                // Generar colores basados en el ID de cada reservación (estáticos)
                                const barColors = barsToShow.map(reservation => getColorFromId(reservation.id));
                                
                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: 'auto' }}>
                                    {barsToShow.map((reservation, index) => (
                                      <div
                                        key={index}
                                        style={{
                                          height: 'auto',
                                          minHeight: '18px',
                                          background: barColors[index],
                                          borderRadius: '4px',
                                          width: '100%',
                                          padding: '3px 6px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}
                                      >
                                        <span style={{
                                          fontSize: '0.65rem',
                                          color: 'white',
                                          fontWeight: '600',
                                          textAlign: 'center',
                                          lineHeight: '1.2',
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis'
                                        }}>
                                          {reservation.resType === 'comedor' 
                                            ? 'Comedor' 
                                            : (reservation.meetingName || 'Sala de Juntas')}
                                        </span>
                                      </div>
                                    ))}
                                    {remainingCount > 0 && (
                                      <div style={{
                                        fontSize: '0.6rem',
                                        color: '#667eea',
                                        fontWeight: '600',
                                        textAlign: 'center',
                                        marginTop: '2px'
                                      }}>
                                        +{remainingCount}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          );
                        }
                        
                        return days;
                      })()}
                      </div>
                    </div>

                    {/* Detalle de reservaciones del día seleccionado */}
                    {selectedDate && (() => {
                      const { comedor, sala } = getFilteredReservationsForDate(selectedDate);
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
                                        <DishIcon size={18} color="#22c55e" /> Comedor - {reservation.userName}
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
                              {sala.map((reservation: RoomReservation) => (
                                <div key={`sala-${reservation.id}`} className="reservation-card">
                                  <div className="reservation-info">
                                    <div className="reservation-time">
                                      <span className="time-icon"><ClockIcon size={20} color="#764ba2" /></span>
                                      <span className="time-text">{reservation.timeRange}</span>
                                    </div>
                                    <div className="reservation-date">
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#764ba2', fontWeight: '600' }}>
                                        <BuildingIcon size={18} color="#3b82f6" /> {reservation.meetingName || 'Sala de Juntas'} - {reservation.userName}
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
                                    {reservation.status === 'Active' && (
                                      <>
                                        <button 
                                          className="btn-edit"
                                          onClick={() => handleOpenReschedule(reservation)}
                                          style={{ marginLeft: '8px', marginRight: '8px' }}
                                        >
                                          Reprogramar
                                        </button>
                                        <button 
                                          className="btn-cancel"
                                          onClick={() => handleCancelAnyRoomReservation(reservation.id)}
                                        >
                                          Cancelar
                                        </button>
                                      </>
                                    )}
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
            
            {/* Barra de búsqueda de usuarios */}
            <div style={{
              marginBottom: '1.5rem',
              padding: '1.5rem',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                    <SearchIcon size={20} color="#718096" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar por nombre, apellido, email o área..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 3rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.3s ease'
                  }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
                {userSearchTerm && (
                  <button
                    onClick={() => setUserSearchTerm('')}
                    style={{
                      padding: '0.75rem 1rem',
                      background: '#f56565',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '1rem',
                      transition: 'background 0.3s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#e53e3e'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#f56565'}
                  >
                    Limpiar
                  </button>
                )}
              </div>
              <div style={{ marginTop: '0.75rem', color: '#718096', fontSize: '0.9rem' }}>
                {filteredUsers.length} de {users.length} usuarios
              </div>
            </div>
            
            {loadingUsers ? (
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
                      <th 
                        onClick={() => handleUserSort('firstName')}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        title="Click para ordenar"
                      >
                        Nombre {userSortColumn === 'firstName' && (userSortDirection === 'asc' ? '▲' : '▼')}
                      </th>
                      <th 
                        onClick={() => handleUserSort('lastName')}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        title="Click para ordenar"
                      >
                        Apellido {userSortColumn === 'lastName' && (userSortDirection === 'asc' ? '▲' : '▼')}
                      </th>
                      <th 
                        onClick={() => handleUserSort('email')}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        title="Click para ordenar"
                      >
                        Correo {userSortColumn === 'email' && (userSortDirection === 'asc' ? '▲' : '▼')}
                      </th>
                      <th 
                        onClick={() => handleUserSort('area')}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        title="Click para ordenar"
                      >
                        Área {userSortColumn === 'area' && (userSortDirection === 'asc' ? '▲' : '▼')}
                      </th>
                      <th 
                        onClick={() => handleUserSort('role')}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        title="Click para ordenar"
                      >
                        Rol {userSortColumn === 'role' && (userSortDirection === 'asc' ? '▲' : '▼')}
                      </th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user: User) => (
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
                            onClick={() => editUser(user)}
                            title="Editar usuario"
                            style={{ marginRight: '8px' }}
                          >
                            <EditIcon size={18} color="white" />
                          </button>
                          <button 
                            className="btn-delete"
                            onClick={() => openDeleteModal(user.id, `${user.firstName} ${user.lastName}`)}
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
    
    {/* Modal de Reprogramación */}
    {showRescheduleModal && reservationToReschedule && (
      <div className="modal-overlay" onClick={() => setShowRescheduleModal(false)}>
        <div className="auth-card" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={() => setShowRescheduleModal(false)}>&times;</button>
          <div className="auth-header">
            <h1>Reprogramar Reservación de Sala</h1>
            <p>Selecciona una nueva fecha y horario</p>
          </div>

          <form className="auth-form" onSubmit={(e) => { e.preventDefault(); handleReschedule(loadAdminReservations); }}>
            <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f7fafc', borderRadius: '8px' }}>
              <p style={{ margin: 0, color: '#4a5568', fontSize: '0.9rem' }}>
                <strong>Reservación actual:</strong>
              </p>
              <p style={{ margin: '0.5rem 0 0 0', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CalendarIcon size={16} color="#667eea" /> {formatDate(reservationToReschedule.date)} <ClockIcon size={16} color="#667eea" /> {reservationToReschedule.timeRange}
              </p>
              <p style={{ margin: '0.25rem 0 0 0', color: '#718096', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserIcon size={16} color="#718096" /> {reservationToReschedule.userName}
              </p>
            </div>

            {rescheduleError && (
              <div className="error-message" style={{ marginBottom: '1rem' }}>
                {rescheduleError}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="rescheduleDate">Nueva Fecha</label>
              <input
                id="rescheduleDate"
                type="date"
                value={rescheduleDate}
                onChange={(e) => {
                  setRescheduleDate(e.target.value);
                  setRescheduleError('');
                  if (rescheduleStartTime && rescheduleEndTime && e.target.value) {
                    checkTimeAvailability();
                  }
                }}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="rescheduleStartTime">Hora de inicio</label>
              <input
                id="rescheduleStartTime"
                type="time"
                value={rescheduleStartTime}
                onChange={(e) => {
                  setRescheduleStartTime(e.target.value);
                  setRescheduleError('');
                }}
                onBlur={checkTimeAvailability}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="rescheduleEndTime">Hora de fin</label>
              <input
                id="rescheduleEndTime"
                type="time"
                value={rescheduleEndTime}
                onChange={(e) => {
                  setRescheduleEndTime(e.target.value);
                  setRescheduleError('');
                }}
                onBlur={checkTimeAvailability}
                required
              />
            </div>

            {checkingAvailability && (
              <div className="info-message" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LoaderIcon size={16} color="#667eea" /> Verificando disponibilidad...
              </div>
            )}

            <div className="info-message" style={{ marginTop: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <div style={{ marginTop: '0.2rem', display: 'flex' }}>
                <InfoIcon size={16} color="#667eea" />
              </div>
              <div><strong>Nota:</strong> La sala debe reservarse con al menos una hora de anticipación.</div>
            </div>

            <div className="button-group" style={{ marginTop: '1.5rem' }}>
              <button 
                type="button" 
                onClick={() => {
                  setShowRescheduleModal(false);
                  setRescheduleDate('');
                  setRescheduleStartTime('');
                  setRescheduleEndTime('');
                  setRescheduleError('');
                }} 
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={!rescheduleDate || !rescheduleStartTime || !rescheduleEndTime || !!rescheduleError || checkingAvailability}
                style={{
                  opacity: (!rescheduleDate || !rescheduleStartTime || !rescheduleEndTime || !!rescheduleError || checkingAvailability) ? 0.5 : 1,
                  cursor: (!rescheduleDate || !rescheduleStartTime || !rescheduleEndTime || !!rescheduleError || checkingAvailability) ? 'not-allowed' : 'pointer'
                }}
              >
                {checkingAvailability ? 'Verificando...' : 'Confirmar Reprogramación'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    
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
    
    {deleteModal.show && deleteModal.user && (
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
                <strong>{deleteModal.user.name}</strong>
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
