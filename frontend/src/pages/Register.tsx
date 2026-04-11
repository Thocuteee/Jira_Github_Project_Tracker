import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import authService from '@/api/auth.service'

export default function Register() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'Register | Project Tracker'
  }, [])

  const passwordMismatch = useMemo(() => {
    if (!password || !confirmPassword) return false
    return password !== confirmPassword
  }, [password, confirmPassword])

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (password !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp.')
      return
    }

    setSubmitting(true)
    try {
      const message = await authService.register({
        name: username.trim(),
        email: email.trim(),
        password,
      })
      setSuccess(typeof message === 'string' ? message : 'Đăng ký thành công.')

      // Cho người dùng về login để đăng nhập
      setTimeout(() => {
        navigate('/login', { replace: true, state: { email } })
      }, 600)
    } catch (e: unknown) {
      // axiosClient trả về error (AxiosError) khi non-2xx; BE thường trả string message
      const msg = (() => {
        try {
          const maybe = e as { response?: { data?: unknown } }
          if (typeof maybe?.response?.data === 'string') return maybe.response.data
        } catch {
          // ignore
        }
        return 'Đăng ký thất bại. Vui lòng thử lại!'
      })()
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl text-white mb-4">
            <UserPlus size={24} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Create your account</h2>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        ) : null}
        {success ? (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            {success}
          </div>
        ) : null}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="you@example.com"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="yourname"
              value={username}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nhập lại Password</label>
            <input
              type="password"
              className={[
                'w-full px-4 py-2 border rounded-lg outline-none transition-all',
                passwordMismatch
                  ? 'border-red-300 focus:ring-2 focus:ring-red-500'
                  : 'border-slate-200 focus:ring-2 focus:ring-blue-500',
              ].join(' ')}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            {passwordMismatch ? <div className="mt-1 text-xs text-red-600">Mật khẩu nhập lại không khớp.</div> : null}
          </div>

          <button
            type="submit"
            disabled={submitting || passwordMismatch}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-70"
          >
            {submitting ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-slate-500">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-blue-600 font-semibold hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  )
}
