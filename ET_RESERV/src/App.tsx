import { useState, useEffect } from 'react'
import Home from './Pages/Home'
import Login from './Pages/Login'
import Register from './Pages/Register'
import ReservHome from './Pages/Reserv_home'

function App() {
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true'
  })

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)
      const authStatus = localStorage.getItem('isAuthenticated') === 'true'
      setIsAuthenticated(authStatus)
      
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
    return <ReservHome />
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
