import { Link } from 'react-router-dom'

export default function Register() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-slate-800">Register</h2>
          <p className="text-slate-500 text-sm mt-2">
            Demo giao diện: trang này hiện chưa nối backend.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          Bạn có thể quay lại trang đăng nhập và xem phần role/overview ở Dashboard.
        </div>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-blue-600 font-semibold hover:underline">
            Quay lại Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  )
}
