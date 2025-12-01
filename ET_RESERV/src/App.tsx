import { useState, useEffect } from 'react'
import Home from './Pages/Home'
import Login from './Pages/Login'
import Register from './Pages/Register'
import ReservHome from './Pages/Reserv_home'
import HomeAdmin from './Pages/Home_Admin'

function App() {
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true'
  })
  const [userType, setUserType] = useState<'empleado' | 'admin'>(() => {
    return (localStorage.getItem('userType') as 'empleado' | 'admin') || 'empleado'
  })

  // Prevenir navegación hacia atrás después de logout
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)
      const authStatus = localStorage.getItem('isAuthenticated') === 'true'
      const currentUserType = (localStorage.getItem('userType') as 'empleado' | 'admin') || 'empleado'
      
      setIsAuthenticated(authStatus)
      setUserType(currentUserType)
      
      if (hash === 'login' && !authStatus) {
        setShowLogin(true)
        setShowRegister(false)
      } else if (hash === 'register' && !authStatus) {
        setShowRegister(true)
        setShowLogin(false)
      } else {
        setShowLogin(false)
        setShowRegister(false)
      }
    }

    // Check initial hash
    handleHashChange()

    window.addEventListener('hashchange', handleHashChange)
    window.addEventListener('storage', handleHashChange)
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      window.removeEventListener('storage', handleHashChange)
    }
  }, [])

  const closeModals = () => {
    setShowLogin(false)
    setShowRegister(false)
    window.location.hash = ''
  }

  if (isAuthenticated) {
    // Redirigir según el tipo de usuario
    if (userType === 'admin') {
      return <HomeAdmin />
    } else {
      return <ReservHome />
    }
  }

  return (
    <>
      <Home />
      {showLogin && <Login onClose={closeModals} />}
      {showRegister && <Register onClose={closeModals} />}
    </>
  )
}

export default App
