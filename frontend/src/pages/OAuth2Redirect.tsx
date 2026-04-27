import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getPrimaryRole } from '@/utils/authDisplay'
import { hydrateSessionProfileFromApi } from '@/utils/sessionProfile'

export default function OAuth2Redirect() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const email = searchParams.get('email') ?? ''
    const oauthError = searchParams.get('error') ?? ''
    const oauthMessage = searchParams.get('message') ?? ''
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
      hydrateSessionProfileFromApi()
        .catch((err) => {
          console.warn('Could not hydrate profile after OAuth redirect, avatar may fallback to initials.', err);
        })
        .finally(() => {
          window.dispatchEvent(new Event('auth-changed'))
          navigate('/dashboard', { replace: true })
        })
      return
    }

    if (oauthError || oauthMessage) {
      const userMessage = oauthMessage
        ? `Đăng nhập Google thất bại: ${oauthMessage}`
        : `Đăng nhập Google thất bại (${oauthError || 'oauth_error'})`;
      sessionStorage.setItem('oauth_error_message', userMessage);
    }

    navigate('/login', { replace: true })
  }, [navigate, searchParams])

  return null
}