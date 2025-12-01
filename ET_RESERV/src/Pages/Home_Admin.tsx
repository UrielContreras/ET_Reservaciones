import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import '../Styles/Reserv_home.css';
import Register from './Register';
import CreateReserv from './Create_reserv';
import UpdateUsers from './Update_users';


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

const HomeAdmin = () => {
  const [showRegister, setShowRegister] = useState(false);
  const [showCreateReserv, setShowCreateReserv] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateUser, setShowUpdateUser] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: number; name: string } | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [showView, setShowView] = useState<'users' | 'reservations'>('users');

  // Función para formatear fecha sin problemas de zona horaria
  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString('es-MX');
  };

  // Función para verificar si una fecha es hoy
  const isToday = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    const reservationDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    reservationDate.setHours(0, 0, 0, 0);
    return reservationDate.getTime() === today.getTime();
  };

  // Filtrar solo las reservaciones de hoy
  const todayReservations = reservations.filter(r => isToday(r.date));

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

  useEffect(() => {
    loadUsers();
    loadReservations();
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

  const handleCreateReservClose = () => {
    setShowCreateReserv(false);
    loadReservations(); // Recargar reservaciones después de crear una nueva
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
      await axios.delete(`${API_BASE_URL}/api/users/${userToDelete.id}`);
      setShowDeleteModal(false);
      setUserToDelete(null);
      loadUsers(); // Recargar la lista de usuarios
    } catch (error) {
      console.error('Error al dar de baja usuario:', error);
      alert('Error al dar de baja el usuario. Por favor intenta de nuevo.');
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
            <p className="card-number">{reservations.length}</p>
            <button className="btn-card" onClick={() => setShowView('reservations')}>Ver todas</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">👥</div>
            <h3>Total de Usuarios</h3>
            <p className="card-number">{users.length}</p>
            <button className="btn-card" onClick={() => setShowView('users')}>Gestionar</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">➕</div>
            <h3>Nuevo Usuario</h3>
            <p className="card-text">Crear usuario manualmente</p>
            <button className="btn-card primary" onClick={() => setShowRegister(true)}>Crear</button>
          </div>
           <div className="dashboard-card">
            <div className="card-icon">➕</div>
            <h3>Nueva Reservacion</h3>
            <p className="card-text">Crea una nueva reservación</p>
            <button className="btn-card primary" onClick={() => setShowCreateReserv(true)}>Crear</button>
          </div>

        </div>

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
                          ✏️
                        </button>
                        <button 
                          className="btn-delete"
                          onClick={() => handleDeleteUser(user.id, `${user.firstName} ${user.lastName}`)}
                          title="Dar de baja usuario"
                        >
                          🗑️ 
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
          <h2>Reservaciones de Hoy</h2>
          {loadingReservations ? (
            <div className="empty-state">
              <p>Cargando reservaciones...</p>
            </div>
          ) : todayReservations.length === 0 ? (
            <div className="empty-state">
              <p>No hay reservaciones para hoy</p>
              <span>Las reservaciones de hoy aparecerán aquí</span>
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
                  {todayReservations.map((reservation) => (
                    <tr key={reservation.id}>
                      <td>{reservation.userName}</td>
                      <td>{reservation.email}</td>
                      <td>{reservation.area || 'N/A'}</td>
                      <td>{formatDate(reservation.date)}</td>
                      <td>{reservation.timeRange}</td>
                      <td>
                        <span className={`role-badge ${reservation.status.toLowerCase()}`}>
                          {reservation.status === 'Active' ? 'Activa' : 
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
