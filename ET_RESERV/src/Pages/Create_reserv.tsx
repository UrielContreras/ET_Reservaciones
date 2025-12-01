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
  const [canReserve, setCanReserve] = useState(true);
  const [minutesUntil10AM, setMinutesUntil10AM] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(120); // 2 minutos en segundos
  const [timerExpired, setTimerExpired] = useState(false);

  useEffect(() => {
    const checkReservationTime = () => {
      const now = new Date();
      const today10AM = new Date();
      today10AM.setHours(10, 0, 0, 0);
      
      if (now < today10AM) {
        setCanReserve(false);
        const minutes = Math.ceil((today10AM.getTime() - now.getTime()) / 60000);
        setMinutesUntil10AM(minutes);
      } else {
        setCanReserve(true);
        setMinutesUntil10AM(0);
      }
    };

    checkReservationTime();
    // Verificar cada minuto
    const interval = setInterval(checkReservationTime, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Temporizador de 2 minutos para completar la reservación
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setTimerExpired(true);
          clearInterval(timer);
          // Cerrar el modal automáticamente después de 2 segundos
          setTimeout(() => {
            onClose();
          }, 2000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onClose]);

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
      } catch (err: unknown) {
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

    if (timerExpired) {
      setError('El tiempo ha expirado. Por favor cierra y abre nuevamente el formulario.');
      return;
    }

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
    } catch (err: unknown) {
      console.error('Reservation failed:', err);
      
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 403) {
          setError('No tienes permisos para crear reservaciones. Asegúrate de estar registrado como empleado.');
        } else if (err.response?.status === 400) {
          const errorMsg = err.response?.data || 'Error al crear la reservación';
          setError(errorMsg);
        } else if (err.response?.data) {
          setError(typeof err.response.data === 'string' ? err.response.data : 'Error al crear la reservación');
        } else {
          setError('Error al crear la reservación. Por favor intenta de nuevo.');
        }
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
          <div style={{ 
            marginTop: '0.5rem', 
            padding: '0.5rem', 
            backgroundColor: timeRemaining <= 30 ? '#fee' : '#e3f2fd',
            borderRadius: '4px',
            fontWeight: 'bold',
            color: timeRemaining <= 30 ? '#c62828' : '#1976d2'
          }}>
            ⏱ Tiempo restante: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
          </div>
        </div>

        {timerExpired && (
          <div className="error-message" style={{ margin: '1rem 0' }}>
            ⏰ El tiempo ha expirado. Cerrando formulario...
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {!canReserve && (
            <div className="error-message" style={{ marginBottom: '1rem' }}>
              ⏰ Las reservaciones solo pueden hacerse a partir de las 10:00 AM.
              {minutesUntil10AM > 60 
                ? ` Faltan ${Math.floor(minutesUntil10AM / 60)} horas y ${minutesUntil10AM % 60} minutos.`
                : ` Faltan ${minutesUntil10AM} minutos.`
              }
            </div>
          )}
          
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
                  <strong>⚠ Importante:</strong> Solo puedes hacer una reservación por día (incluso si ya completaste una).
                </div>
              )}

              {error && <div className="error-message">{error}</div>}
              {successMessage && <div className="success-message">{successMessage}</div>}

              <button type="submit" className="btn-primary" disabled={timerExpired || !canReserve || loading || !timeSlotId}>
                {timerExpired ? 'Tiempo expirado' : !canReserve ? 'Reservaciones abren a las 10:00 AM' : 'Crear Reservación'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateReserv;
