import { useState } from 'react';
import '../Styles/Auth.css';

interface CreateReservProps {
  onClose: () => void;
}

const CreateReserv = ({ onClose }: CreateReservProps) => {
  const [formData, setFormData] = useState({
    title: '',
    //date: '',
    time: '',
    duration: '',
    location: '',
    description: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Nueva Reservación:', formData);
    // Aquí iría la lógica para guardar la reservación
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
          

          <div className="form-row">
            

            <div className="form-group">
              <label htmlFor="time">Hora</label>
              <input
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="duration">Duración</label>
              <select
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar</option>
                <option value="30">30 minutos</option>
                <option value="60">1 hora</option>
              </select>
            </div>

              <div className="form-group">
              <label htmlFor="location">Ubicacion</label>
              <select
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar</option>
                <option value="Comedor">Comedor</option>
                <option value="Sala de juntas">Sala de juntas</option>
              </select>
            </div>
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
