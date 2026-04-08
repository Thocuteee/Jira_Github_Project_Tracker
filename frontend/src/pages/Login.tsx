import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Globe, GitBranch, LogIn } from 'lucide-react'
import authService from '@/api/auth.service'
import { getPrimaryRole } from '@/utils/authDisplay'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const navigate = useNavigate()

    useEffect(() => {
        document.title = 'Login | Project Tracker'
    }, [])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSubmitting(true)
        try {
        const response = await authService.login({ email: email.trim(), password })

        // Lưu Token vào localStorage để Gateway có thể xác thực
        localStorage.setItem('accessToken', response.token || '')
        localStorage.setItem('refreshToken', response.refreshToken || '')

        localStorage.setItem('userEmail', response.email)
        localStorage.setItem('userName', response.email.split('@')[0] || response.email)
        localStorage.setItem('userSubtitle', getPrimaryRole(response.roles ?? []))
        localStorage.setItem('userRoles', JSON.stringify(response.roles ?? []))
        window.dispatchEvent(new Event('auth-changed'))

        navigate('/', { replace: true })
        } catch (e: unknown) {
        const msg = (() => {
            try {
            const maybe = e as { response?: { data?: unknown } }
            if (typeof maybe?.response?.data === 'string') return maybe.response.data
            } catch {
            // ignore
            }
            return 'Đăng nhập thất bại. Vui lòng kiểm tra lại!'
        })()
        setError(msg)
        } finally {
        setSubmitting(false)
        }
    }

    const handleOAuth = (provider: string) => {
        // Đi qua Nginx (http://localhost), không gọi thẳng port 8081
        const authBaseUrl = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost'
        if (provider === 'google') {
            window.location.href = `${authBaseUrl}/api/auth/oauth2/authorization/google`
            return
        }
        if (provider === 'github') {
            window.location.href = `${authBaseUrl}/api/auth/oauth2/authorization/github`
            return
        }
        alert(`OAuth (${provider}) chưa tích hợp vào BE hiện tại.`)
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
            <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl text-white mb-4">
                <LogIn size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Sign in to your workspace</h2>
            </div>

            {error ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
            ) : null}

            <form onSubmit={handleLogin} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                type="email"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input
                type="password"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                />
            </div>

            <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-70"
            >
                {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
            </form>

            <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400 font-medium">Hoặc đăng nhập với</span>
            </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
            <button
                type="button"
                onClick={() => handleOAuth('google')}
                className="flex items-center justify-center gap-2 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all font-medium text-slate-700"
            >
                <Globe size={18} className="text-red-500" /> Google
            </button>

            <button
                type="button"
                onClick={() => handleOAuth('github')}
                className="flex items-center justify-center gap-2 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all font-medium text-slate-700"
            >
                <GitBranch size={18} /> GitHub
            </button>
            </div>

            <p className="text-center mt-8 text-sm text-slate-500">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-blue-600 font-semibold hover:underline">
                Đăng ký ngay
            </Link>
            </p>
        </div>
        </div>
    )
}