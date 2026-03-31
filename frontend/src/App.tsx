import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from '@/pages/Dashboard'
import Login from '@/pages/Login'
import Register from '@/pages/Register'

function isMockAuthed() {
  try {
    return Boolean(localStorage.getItem('accessToken') && (localStorage.getItem('userEmail') || localStorage.getItem('userName')))
  } catch {
    return false
  }
}

export default function App() {
  const authed = isMockAuthed()

  return (
    <Router>
      <Routes>
        {/* Vào http://localhost:5173 (/) sẽ luôn tới Dashboard đầu tiên nếu đã đăng nhập */}
        <Route path="/" element={authed ? <Dashboard /> : <Login />} />

        {/* Alias route */}
        <Route path="/dashboard" element={authed ? <Dashboard /> : <Navigate to="/" replace />} />
        <Route path="/login" element={authed ? <Navigate to="/" replace /> : <Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}