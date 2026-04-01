import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from '@/pages/Dashboard'
import Login from '@/pages/Login'
import Register from '@/pages/Register'

function isMockAuthed() {
  try {
    return Boolean(localStorage.getItem('userEmail') || localStorage.getItem('userName'))
  } catch {
    return false
  }
}

export default function App() {
  const [authed, setAuthed] = useState<boolean>(() => isMockAuthed())

  useEffect(() => {
    const syncAuthState = () => setAuthed(isMockAuthed())

    window.addEventListener('storage', syncAuthState)
    window.addEventListener('auth-changed', syncAuthState)

    return () => {
      window.removeEventListener('storage', syncAuthState)
      window.removeEventListener('auth-changed', syncAuthState)
    }
  }, [])

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to={authed ? '/dashboard' : '/login'} replace />} />
        <Route path="/dashboard" element={authed ? <Dashboard /> : <Navigate to="/login" replace />} />
        <Route path="/login" element={authed ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/signin" element={<Navigate to="/login" replace />} />
        <Route path="/auth/login" element={<Navigate to="/login" replace />} />

        <Route path="/register" element={<Register />} />

        <Route path="*" element={<Navigate to={authed ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </Router>
  )
}