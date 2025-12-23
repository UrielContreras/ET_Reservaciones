import { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import '../Styles/Auth.css';

interface CreateRoomReservProps {
  onClose: () => void;
}

const CreateRoomReserv = ({ onClose }: CreateRoomReservProps) => {
  const [meetingName, setMeetingName] = useState('');
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

    // Convertir las horas a formato HH:mm de 24 horas
    const formatTime = (time: string): string => {
      // Si el tiempo ya está en formato HH:mm, devolverlo tal cual
      if (/^\d{2}:\d{2}$/.test(time)) {
        return time;
      }
      // Si no, crear un objeto Date y extraer la hora
      const date = new Date(`2000-01-01T${time}`);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    };

    const formattedStartTime = formatTime(startTime);
    const formattedEndTime = formatTime(endTime);

    // Validar que la hora de fin sea después de la hora de inicio
    if (formattedEndTime <= formattedStartTime) {
      setError('La hora de fin debe ser después de la hora de inicio');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      console.log('Creando reservación de sala con:', {
        date: selectedDate,
        startTime: formattedStartTime,
        endTime: formattedEndTime
      });

      const response = await axios.post(
        `${API_BASE_URL}/api/roomreservations`,
        {
          date: selectedDate,
          startTime: formattedStartTime,
          endTime: formattedEndTime
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('Respuesta del servidor:', response.data);
      alert('Reservación de sala creada exitosamente');
      onClose();
    } catch (err: unknown) {
      console.error('Error completo al crear reservación:', err);
      if (axios.isAxiosError(err)) {
        console.error('Response data:', err.response?.data);
        console.error('Response status:', err.response?.status);
        console.error('Response headers:', err.response?.headers);
        
        const errorData = err.response?.data;
        let errorMessage = 'Error al crear la reservación';
        
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData?.message) {
          errorMessage = errorData.message;
        } else if (errorData?.errors) {
          // Manejar errores de validación de ASP.NET
          const validationErrors = Object.values(errorData.errors).flat();
          errorMessage = validationErrors.join(', ');
        }
        
        setError(errorMessage);
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
            <label htmlFor="meetingName">Nombre de la reunión</label>
            <input
              type="text"
              id="meetingName"
              value={meetingName}
              onChange={(e) => setMeetingName(e.target.value)}
              required
            />
          </div>
          
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
