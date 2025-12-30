import { useState, useMemo } from 'react';
import type { User } from '../types';
import * as userService from '../services/userService';

/**
 * Custom Hook para gestionar usuarios en el panel de administración
 * 
 * Responsabilidades:
 * - Cargar lista de usuarios desde la API
 * - Filtrar y ordenar usuarios según criterios
 * - Gestionar eliminación de usuarios (modal y confirmación)
 * - Gestionar edición de usuarios
 */
export const useUserManagement = () => {
  // Estado de usuarios
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado de filtrado y ordenamiento
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userSortColumn, setUserSortColumn] = useState<'firstName' | 'lastName' | 'email' | 'area' | 'role'>('firstName');
  const [userSortDirection, setUserSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Estado de modales
  const [userToDelete, setUserToDelete] = useState<{ id: number; name: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [showUpdateUser, setShowUpdateUser] = useState(false);

  /**
   * Cargar todos los usuarios desde la API
   */
  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cambiar columna y dirección de ordenamiento
   */
  const handleUserSort = (column: typeof userSortColumn) => {
    if (userSortColumn === column) {
      setUserSortDirection(userSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setUserSortColumn(column);
      setUserSortDirection('asc');
    }
  };

  /**
   * Usuarios filtrados y ordenados (computado con useMemo para optimización)
   */
  const filteredUsers = useMemo(() => {
    // Filtrar por término de búsqueda
    const filtered = users.filter(user => {
      const searchLower = userSearchTerm.toLowerCase();
      return (
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        (user.area?.toLowerCase() || '').includes(searchLower)
      );
    });

    // Ordenar según columna y dirección
    filtered.sort((a, b) => {
      let aValue = a[userSortColumn] || '';
      let bValue = b[userSortColumn] || '';
      
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (aValue < bValue) return userSortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return userSortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, userSearchTerm, userSortColumn, userSortDirection]);

  /**
   * Abrir modal de eliminación
   */
  const openDeleteModal = (userId: number, userName: string) => {
    setUserToDelete({ id: userId, name: userName });
    setShowDeleteModal(true);
  };

  /**
   * Cancelar eliminación y cerrar modal
   */
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  /**
   * Confirmar y ejecutar eliminación de usuario
   */
  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await userService.deleteUser(userToDelete.id);
      console.log('Usuario eliminado exitosamente');
      setShowDeleteModal(false);
      setUserToDelete(null);
      await loadUsers(); // Recargar la lista de usuarios
    } catch (error: unknown) {
      console.error('Error completo al dar de baja usuario:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al dar de baja el usuario. Por favor intenta de nuevo.';
      alert(`Error: ${errorMessage}`);
    }
  };

  /**
   * Abrir modal de edición de usuario
   */
  const editUser = (user: User) => {
    setUserToEdit(user);
    setShowUpdateUser(true);
  };

  /**
   * Cerrar modal de edición
   */
  const closeUpdateUser = () => {
    setShowUpdateUser(false);
    setUserToEdit(null);
  };

  return {
    // Estado
    users,
    loading,
    filteredUsers,
    
    // Filtrado y ordenamiento
    userSearchTerm,
    setUserSearchTerm,
    userSortColumn,
    userSortDirection,
    handleUserSort,
    
    // Eliminación
    deleteModal: {
      show: showDeleteModal,
      user: userToDelete
    },
    openDeleteModal,
    confirmDelete,
    cancelDelete,
    
    // Edición
    userToEdit,
    showUpdateUser,
    editUser,
    closeUpdateUser,
    
    // Funciones
    loadUsers
  };
};
