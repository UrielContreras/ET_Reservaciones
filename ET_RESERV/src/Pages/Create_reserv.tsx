import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import '../Styles/Auth.css';

interface CreateReservProps {
  onClose: () => void;
}

interface TimeSlot {
  id: number;
  timeRange: string;
  available: number;
}

const CreateReserv = ({ onClose }: CreateReservProps) => {
  const [timeSlotId, setTimeSlotId] = useState<number | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeSlots = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No estás autenticado');
          setLoading(false);
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/api/reservations/timeslots`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setTimeSlots(response.data);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching timeslots:', err);
        setError('Error al cargar los horarios disponibles');
        setLoading(false);
      }
    };

    fetchTimeSlots();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!timeSlotId) {
      setError('Por favor selecciona un horario');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No estás autenticado');
        return;
      }

      await axios.post(
        `${API_BASE_URL}/api/reservations`,
        { timeSlotId },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setSuccessMessage('¡Reservación creada exitosamente!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Reservation failed:', err);
      console.error('Response data:', err.response?.data);
      console.error('Response status:', err.response?.status);
      
      if (err.response?.status === 403) {
        setError('No tienes permisos para crear reservaciones. Asegúrate de estar registrado como empleado.');
      } else if (err.response?.data) {
        setError(typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data));
      } else {
        setError('Error al crear la reservación. Por favor intenta de nuevo.');
      }
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="auth-card create-reserv-card">
        <button className="modal-close" onClick={onClose}>&times;</button>
        <div className="auth-header">
          <h1>Nueva Reservación</h1>
          <p>Completa los detalles de tu reservación</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {loading ? (
            <div className="loading-message">Cargando horarios disponibles...</div>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="timeSlot">Selecciona tu horario</label>
                <select
                  id="timeSlot"
                  value={timeSlotId || ''}
                  onChange={(e) => setTimeSlotId(Number(e.target.value))}
                  required
                  className="time-slot-select"
                >
                  <option value="">Seleccionar horario</option>
                  {timeSlots.map((slot) => {
                    const isDisabled = slot.available === 0;
                    let colorClass = '';
                    if (slot.available > 3) colorClass = 'available-high';
                    else if (slot.available >= 2 && slot.available <= 3) colorClass = 'available-medium';
                    else if (slot.available === 1) colorClass = 'available-low';
                    else colorClass = 'available-none';
                    
                    return (
                      <option 
                        key={slot.id} 
                        value={slot.id}
                        disabled={isDisabled}
                        className={colorClass}
                      >
                        {slot.timeRange} {isDisabled ? '(Sin disponibilidad)' : `(${slot.available} lugares disponibles)`}
                      </option>
                    );
                  })}
                </select>
                
                {timeSlotId && (
                  <div className="availability-indicators">
                    {timeSlots.map((slot) => {
                      if (slot.id === timeSlotId) {
                        let colorClass = '';
                        let message = '';
                        if (slot.available > 3) {
                          colorClass = 'indicator-green';
                          message = `✓ Buena disponibilidad (${slot.available} lugares)`;
                        } else if (slot.available >= 2 && slot.available <= 3) {
                          colorClass = 'indicator-yellow';
                          message = `⚠ Disponibilidad media (${slot.available} lugares)`;
                        } else if (slot.available === 1) {
                          colorClass = 'indicator-orange';
                          message = `⚠ Último lugar disponible`;
                        } else {
                          colorClass = 'indicator-red';
                          message = `✕ Sin disponibilidad`;
                        }
                        return (
                          <div key={slot.id} className={`availability-indicator ${colorClass}`}>
                            {message}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
              </div>

              {timeSlotId && (
                <div className="info-message">
                  <strong>Nota:</strong> Solo puedes tener una reserva activa por día.
                </div>
              )}

              {error && <div className="error-message">{error}</div>}
              {successMessage && <div className="success-message">{successMessage}</div>}

              <button type="submit" className="btn-primary" disabled={loading || !timeSlotId}>
                Crear Reservación
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateReserv;
