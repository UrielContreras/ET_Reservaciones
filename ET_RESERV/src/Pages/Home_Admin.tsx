import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import '../Styles/Reserv_home.css';
import Register from './Register';
import CreateReserv from './Create_reserv';
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateUser, setShowUpdateUser] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: number; name: string } | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [showView, setShowView] = useState<'users' | 'reservations'>('users');
  const [userName, setUserName] = useState<string>('');
  const [myAdminReservations, setMyAdminReservations] = useState<AdminReservation[]>([]);
  const [loadingAdminReservations, setLoadingAdminReservations] = useState(true);

  // Función para formatear fecha sin problemas de zona horaria
  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString('es-MX');
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

  const loadReservations = async () => {
    try {
      setLoadingReservations(true);
      const response = await axios.get(`${API_BASE_URL}/api/reservations/all`);
      setReservations(response.data);
    } catch (error) {
      console.error('Error al cargar reservaciones:', error);
    } finally {
      setLoadingReservations(false);
    }
  };

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

      console.log('[ADMIN] Llamando a /api/reservations/today...');
      const response = await axios.get(`${API_BASE_URL}/api/reservations/today`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('[ADMIN] Reservaciones de hoy recibidas:', response.data);
      console.log('[ADMIN] Cantidad de reservaciones:', response.data.length);
      setMyAdminReservations(response.data);
    } catch (error: any) {
      console.error('[ADMIN] Error al cargar reservaciones:', error);
      console.error('[ADMIN] Status:', error.response?.status);
      console.error('[ADMIN] Data:', error.response?.data);
      if (error.response?.status === 403) {
        console.error('[ADMIN] Error 403: No tienes permisos. Necesitas cerrar sesión y volver a iniciar sesión.');
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

  useEffect(() => {
    loadUsers();
    loadReservations();
    loadUserProfile();
    loadAdminReservations();
  }, []);

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
    } catch (error: any) {
      console.error('Error completo al dar de baja usuario:', error);
      console.error('Respuesta del servidor:', error.response?.data);
      console.error('Status:', error.response?.status);
      const errorMessage = error.response?.data?.message || error.response?.data || 'Error al dar de baja el usuario. Por favor intenta de nuevo.';
      alert(`Error: ${errorMessage}`);
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

        <div className="reserv-dashboard">
          <div className="dashboard-card">
            <div className="card-icon"><ChartIcon size={32} color="#667eea" /></div>
            <h3>Total Reservaciones</h3>
            <p className="card-number">{reservations.length}</p>
            <button className="btn-card" onClick={() => setShowView('reservations')}>Ver todas</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon"><UsersIcon size={32} color="#667eea" /></div>
            <h3>Total de Usuarios</h3>
            <p className="card-number">{users.length}</p>
            <button className="btn-card" onClick={() => setShowView('users')}>Gestionar</button>
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
            <button className="btn-card primary" onClick={() => setShowCreateReserv(true)}>Crear</button>
          </div>

        </div>

        <section className="recent-section">
          <h2>Mis Reservaciones de Hoy</h2>
          {loadingAdminReservations ? (
            <div className="empty-state">
              <p>Cargando...</p>
            </div>
          ) : myAdminReservations.length === 0 ? (
            <div className="empty-state">
              <p>No hay reservaciones para hoy</p>
              <span>Las reservaciones aparecerán aquí</span>
            </div>
          ) : (
            <div className="reservations-list">
              {myAdminReservations.map((reservation) => (
                <div key={reservation.id} className="reservation-card">
                  <div className="reservation-info">
                    <div className="reservation-time">
                      <span className="time-icon"><ClockIcon size={20} color="#667eea" /></span>
                      <span className="time-text">{reservation.timeRange}</span>
                    </div>
                    <div className="reservation-date">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CalendarIcon size={18} color="#718096" /> {formatDate(reservation.date)}
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
            </div>
          )}
        </section>

        {showView === 'users' && (
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

        {showView === 'reservations' && (
          <section className="recent-section">
          <h2>Últimas 5 Reservaciones</h2>
          {loadingReservations ? (
            <div className="empty-state">
              <p>Cargando reservaciones...</p>
            </div>
          ) : reservations.length === 0 ? (
            <div className="empty-state">
              <p>No hay reservaciones</p>
              <span>Las reservaciones aparecerán aquí</span>
            </div>
          ) : (
            <div className="table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Correo</th>
                    <th>Área</th>
                    <th>Fecha</th>
                    <th>Horario</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.slice(0, 5).map((reservation) => (
                    <tr key={reservation.id}>
                      <td>{reservation.userName}</td>
                      <td>{reservation.email}</td>
                      <td>{reservation.area || 'N/A'}</td>
                      <td>{formatDate(reservation.date)}</td>
                      <td>{reservation.timeRange}</td>
                      <td>
                        <span className={`role-badge ${reservation.status.toLowerCase()}`}>
                          {reservation.status === 'Active' ? 'Activa' : 
                           reservation.status === 'InProgress' ? 'En Curso' :
                           reservation.status === 'Cancelled' ? 'Cancelada' : 
                           reservation.status === 'Expired' ? 'Expirada' : 
                           reservation.status === 'Completed' ? 'Completada' : reservation.status}
                        </span>
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
    {showUpdateUser && userToEdit && <UpdateUsers onClose={handleUpdateUserClose} user={userToEdit} />}
    {showChangePassword && <ChangePassword onClose={() => setShowChangePassword(false)} />}
    
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
