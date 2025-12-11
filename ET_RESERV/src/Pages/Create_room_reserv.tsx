import { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import '../Styles/Auth.css';

interface CreateRoomReservProps {
  onClose: () => void;
}

const CreateRoomReserv = ({ onClose }: CreateRoomReservProps) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!selectedDate || !startTime || !endTime) {
      setError('Por favor completa todos los campos');
      return;
    }

    // Validar que la hora de fin sea después de la hora de inicio
    if (endTime <= startTime) {
      setError('La hora de fin debe ser después de la hora de inicio');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.post(
        `${API_BASE_URL}/api/roomreservations`,
        {
          date: selectedDate,
          startTime: startTime,
          endTime: endTime
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert('Reservación de sala creada exitosamente');
      onClose();
    } catch (err: unknown) {
      console.error('Error al crear reservación:', err);
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data || err.response?.data?.message || 'Error al crear la reservación';
        setError(typeof errorMessage === 'string' ? errorMessage : 'Error al crear la reservación');
      } else {
        setError('Error al crear la reservación');
      }
    } finally {
      setLoading(false);
    }
  };

  // Obtener la fecha mínima (hoy)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="auth-card">
        <button className="modal-close" onClick={onClose}>&times;</button>
        
        <div className="auth-header">
          <h1>Nueva Reservación de Sala</h1>
          <p>Selecciona la fecha y horario para tu reunión</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="date">Fecha de la reunión</label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={today}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="startTime">Hora de inicio</label>
            <input
              type="time"
              id="startTime"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="endTime">Hora de fin</label>
            <input
              type="time"
              id="endTime"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>

          <div className="info-message" style={{ marginTop: '1rem' }}>
            <strong>ℹ️ Nota:</strong> La sala debe reservarse con al menos una hora de anticipación.
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creando...' : 'Crear Reservación'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomReserv;
