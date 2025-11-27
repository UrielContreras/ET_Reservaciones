import { useState } from 'react';
import '../Styles/Auth.css';

interface CreateReservProps {
  onClose: () => void;
}

// Definir los horarios disponibles
const HORARIOS = [
  { value: '13:00-13:40', label: '13:00 a 13:40' },
  { value: '13:41-14:21', label: '13:41 a 14:21' },
  { value: '14:22-15:02', label: '14:22 a 15:02' },
  { value: '15:03-15:43', label: '15:03 a 15:43' },
  { value: '15:44-16:24', label: '15:44 a 16:24' },
  { value: '16:25-17:05', label: '16:25 a 17:05' },
];

const MAX_CAPACIDAD = 5; // Capacidad máxima por horario

const CreateReserv = ({ onClose }: CreateReservProps) => {
  const [formData, setFormData] = useState({
    title: '',
    time: '',
    duration: '',
    location: '',
    description: ''
  });

  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');

  // Calcular disponibilidad por horario basado en la ubicación seleccionada
  const calcularDisponibilidad = (): { [key: string]: number } => {
    const reservasGuardadas = JSON.parse(localStorage.getItem('reservaciones') || '[]');
    const disponibilidadPorHorario: { [key: string]: number } = {};
    
    HORARIOS.forEach(horario => {
      const reservasEnHorario = reservasGuardadas.filter(
        (r: { time: string; location: string }) => 
          r.time === horario.value && r.location === formData.location
      ).length;
      disponibilidadPorHorario[horario.value] = MAX_CAPACIDAD - reservasEnHorario;
    });
    
    return disponibilidadPorHorario;
  };

  const disponibilidad = calcularDisponibilidad();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'duration') {
      setSelectedTimeSlot(value);
    }
    
    setFormData({
      ...formData,
      [name]: value,
      ...(name === 'duration' && { time: value })
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar disponibilidad
    if (disponibilidad[formData.time] <= 0) {
      alert('No hay lugares disponibles en este horario');
      return;
    }
    
    // Guardar la reservación en localStorage
    const reservasGuardadas = JSON.parse(localStorage.getItem('reservaciones') || '[]');
    const nuevaReserva = {
      ...formData,
      id: Date.now(),
      fecha: new Date().toLocaleDateString(),
    };
    
    reservasGuardadas.push(nuevaReserva);
    localStorage.setItem('reservaciones', JSON.stringify(reservasGuardadas));
    
    console.log('Nueva Reservación:', nuevaReserva);
    alert('Reservación creada exitosamente');
    onClose();
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
          

          <div className="form-group">
            <label htmlFor="location">Ubicación</label>
            <select
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar ubicación</option>
              <option value="Comedor">Comedor</option>
              <option value="Sala de juntas">Sala de juntas</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="duration">
              Horario 
              {selectedTimeSlot && formData.location && (
                <span className={`availability-badge ${disponibilidad[selectedTimeSlot] === 0 ? 'full' : disponibilidad[selectedTimeSlot] <= 2 ? 'low' : 'available'}`}>
                  {disponibilidad[selectedTimeSlot] || 0} lugares disponibles
                </span>
              )}
            </label>
            <select
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              required
              disabled={!formData.location}
            >
              <option value="">Seleccionar horario</option>
              {HORARIOS.map((horario) => {
                const disponible = disponibilidad[horario.value] || MAX_CAPACIDAD;
                const isDisabled = disponible === 0;
                
                return (
                  <option 
                    key={horario.value} 
                    value={horario.value}
                    disabled={isDisabled}
                  >
                    {horario.label} {isDisabled ? '(Sin disponibilidad)' : `(${disponible} lugares)`}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Descripción (opcional)</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Detalles adicionales..."
              rows={4}
            />
          </div>

          <button type="submit" className="btn-primary">
            Crear Reservación
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateReserv;
