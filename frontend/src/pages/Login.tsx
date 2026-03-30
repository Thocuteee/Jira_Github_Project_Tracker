import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Globe, GitBranch, LogIn } from 'lucide-react'

function setMockAuth(payload: { userName: string; roles: string[] }) {
    localStorage.setItem('mockAccessToken', 'mock-token')
    localStorage.setItem('mockUserName', payload.userName)
    localStorage.setItem('mockUserSubtitle', 'Demo user')
    localStorage.setItem('mockRoles', JSON.stringify(payload.roles))
}

export default function Login() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        document.title = 'Login | Project Tracker'
    }, [])

    const submitMock = (e: React.FormEvent, roleSet: string[]) => {
        e.preventDefault()

        const name = username.trim() ? username.trim() : 'Demo User'
        setMockAuth({ userName: name, roles: roleSet })
        navigate('/', { replace: true })
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
            <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl text-white mb-4">
                <LogIn size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Sign in to your workspace</h2>
            <p className="text-slate-500 text-sm mt-1">Demo only (không gọi backend).</p>
            </div>

            <form
            onSubmit={(e) =>
                submitMock(e, ['ROLE_USER', 'ROLE_PROJECT_MANAGER', 'ROLE_VIEWER'])
            }
            className="space-y-4"
            >
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                <input
                type="text"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Nhập username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
            >
                Đăng nhập
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
                onClick={(e) => {
                e.preventDefault()
                setMockAuth({
                    userName: 'Google User',
                    roles: ['ROLE_USER', 'ROLE_VIEWER'],
                })
                navigate('/', { replace: true })
                }}
                className="flex items-center justify-center gap-2 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all font-medium text-slate-700"
            >
                <Globe size={18} className="text-red-500" /> Google
            </button>

            <button
                type="button"
                onClick={(e) => {
                e.preventDefault()
                setMockAuth({
                    userName: 'GitHub User',
                    roles: ['ROLE_USER', 'ROLE_PROJECT_MANAGER', 'ROLE_MAINTAINER'],
                })
                navigate('/', { replace: true })
                }}
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