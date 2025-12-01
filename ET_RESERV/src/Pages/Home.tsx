import '../Styles/Home.css';
import { StarIcon, SecureIcon, PhoneIcon } from '../components/Icons';


const Home = () => {
  return (
    <div className="home-container">
      <nav className="navbar">
        <div className="nav-brand">
          <h2>ET Reservaciones</h2>
        </div>
        <div className="nav-links">
          <a href="#login">Iniciar Sesión</a>
          
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Reserva tu espacio
            <span className="gradient-text"> en segundos</span>
          </h1>
          <p className="hero-subtitle">
            Reserva tu espacio en la Oficina. 
          </p>
          <div className="hero-buttons">
            
            <a href="#login" className="btn-secondary">Iniciar Sesión</a>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="feature-card">
          <div className="card-icon"><StarIcon size={32} color="#667eea" /></div>
          <h3>Rápido</h3>
          <p>Reserva en menos de un minuto</p>
        </div>
        <div className="feature-card">
          <div className="card-icon"><SecureIcon size={32} color="#667eea" /></div>
          <h3>Seguro</h3>
          <p>Tus datos están protegidos</p>
        </div>
        <div className="feature-card">
          <div className="card-icon"><PhoneIcon size={32} color="#667eea" /></div>
          <h3>Accesible</h3>
          <p>Desde cualquier dispositivo</p>
        </div>
      </section>
    </div>
  );
};

export default Home;