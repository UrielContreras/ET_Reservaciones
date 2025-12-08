import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import '../Styles/Auth.css';

interface QRScannerProps {
  onClose: () => void;
  onSuccess: () => void;
  mode: 'checkin' | 'checkout';
}

const QRScanner = ({ onClose, onSuccess, mode }: QRScannerProps) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerDivId = 'qr-reader';

  useEffect(() => {
    if (!scanning) {
      // Inicializar escáner
      scannerRef.current = new Html5QrcodeScanner(
        scannerDivId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false
      );

      scannerRef.current.render(onScanSuccess, onScanError);
      setScanning(true);
    }

    // Cleanup al desmontar
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => {
          console.error('Error al limpiar escáner:', err);
        });
      }
    };
  }, []);

  const onScanSuccess = async (decodedText: string) => {
    console.log('Código QR escaneado:', decodedText);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No estás autenticado');
        return;
      }

      const endpoint = mode === 'checkin' 
        ? `${API_BASE_URL}/api/reservations/check-in`
        : `${API_BASE_URL}/api/reservations/check-out`;

      const response = await axios.post(
        endpoint,
        { qrCode: decodedText },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setSuccessMessage(response.data.message);
      
      // Detener el escáner
      if (scannerRef.current) {
        await scannerRef.current.clear();
      }

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: unknown) {
      console.error('Error en check-in/out:', err);
      
      if (axios.isAxiosError(err)) {
        if (err.response?.data) {
          setError(typeof err.response.data === 'string' ? err.response.data : 'Error en la operación');
        } else {
          setError('Error al procesar el código QR');
        }
      } else {
        setError('Error al procesar el código QR');
      }
    }
  };

  const onScanError = (errorMessage: string) => {
    // No mostrar errores de escaneo continuos
    if (!errorMessage.includes('NotFoundException')) {
      console.warn('Error de escaneo:', errorMessage);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="auth-card" style={{ maxWidth: '500px' }}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <div className="auth-header">
          <h1>{mode === 'checkin' ? 'Check-In' : 'Check-Out'}</h1>
          <p>Escanea el código QR del comedor</p>
        </div>

        <div className="modal-content" style={{ padding: '1rem' }}>
          {successMessage ? (
            <div className="success-message" style={{ marginBottom: '1rem' }}>
              {successMessage}
            </div>
          ) : (
            <>
              <div id={scannerDivId} style={{ width: '100%' }}></div>
              
              {error && (
                <div className="error-message" style={{ marginTop: '1rem' }}>
                  {error}
                </div>
              )}

              <div className="info-message" style={{ marginTop: '1rem' }}>
                <strong>Instrucciones:</strong>
                <ul style={{ textAlign: 'left', marginTop: '0.5rem' }}>
                  <li>Permite el acceso a la cámara cuando se solicite</li>
                  <li>Enfoca el código QR del comedor</li>
                  <li>Espera a que se detecte automáticamente</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
