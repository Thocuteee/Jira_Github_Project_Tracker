import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { GroupProvider } from './contexts/GroupContext'
import { FcmProvider } from './contexts/FcmContext'
import Dashboard from '@/pages/Dashboard'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import OAuth2Redirect from './pages/OAuth2Redirect'

//Test 
import WorkspaceList from './pages/WorkspaceList';
import WorkspaceDashboard from './pages/WorkspaceDashboard';
import AdminWorkspace from './pages/AdminWorkspace';
import LecturerManagement from './pages/LecturerManagement';
import GroupMembers from './pages/GroupMembers';
import Integrations from './pages/Integrations';

function isMockAuthed() {
  try {
    const localAuthed = Boolean(localStorage.getItem('userEmail') || localStorage.getItem('userName'))
    if (localAuthed) return true

    // OAuth2 callback mới đi thẳng /dashboard kèm query user info
    if (window.location.pathname === '/dashboard') {
      const params = new URLSearchParams(window.location.search)
      return Boolean(params.get('email'))
    }
    return false
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
      <FcmProvider>
      <GroupProvider>
        <Routes>
          <Route path="/" element={<Navigate to={authed ? '/dashboard' : '/login'} replace />} />
          <Route path="/dashboard" element={authed ? <Dashboard /> : <Navigate to="/login" replace />} />
          <Route path="/login" element={authed ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/signin" element={<Navigate to="/login" replace />} />
          <Route path="/auth/login" element={<Navigate to="/login" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/oauth2/redirect" element={<OAuth2Redirect />} />

        {/* Test */}
        <Route path="/workspaces" element={<WorkspaceList />} />
        <Route path="/workspace/:groupId" element={<WorkspaceDashboard />} />
        <Route path="/admin/workspace" element={<AdminWorkspace />} />
        <Route path="/admin/lecturers" element={<LecturerManagement />} />
        <Route path="/members/:groupId" element={<GroupMembers />} />
        <Route path="/members" element={<GroupMembers />} />
        <Route path="/settings/integrations" element={<Integrations />} />

          <Route path="*" element={<Navigate to={authed ? '/dashboard' : '/login'} replace />} />
        </Routes>
      </GroupProvider>
      </FcmProvider>
    </Router>
  )
}