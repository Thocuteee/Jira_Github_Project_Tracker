import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getPrimaryRole } from '@/utils/authDisplay'

export default function OAuth2Redirect() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const email = searchParams.get('email') ?? ''
    const name = searchParams.get('name') ?? ''
    const rolesRaw = searchParams.get('roles') ?? ''
    const roles = rolesRaw
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean)

    if (email) {
      localStorage.setItem('userEmail', email)
      localStorage.setItem('userName', name || email.split('@')[0] || email)
      localStorage.setItem('userRoles', JSON.stringify(roles))
      localStorage.setItem('userSubtitle', getPrimaryRole(roles))
      window.dispatchEvent(new Event('auth-changed'))
      navigate('/dashboard', { replace: true })
      return
    }

    navigate('/login', { replace: true })
  }, [navigate, searchParams])

  return null
}