import { Search, Bell } from 'lucide-react';

export default function Header() {
  // Giả sử lấy thông tin user từ LocalStorage hoặc Context
    const username = localStorage.getItem('username') || 'User';

    return (
        <header className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-slate-50">
        {/* Thanh Search nhanh */}
        <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="search" placeholder="Search tasks, groups..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none" />
        </div>
        
        {/* Thông báo và User Avatar */}
        <div className="flex items-center gap-4">
            <button className="relative text-slate-500 hover:text-slate-900">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500"></span>
            </button>
            <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                {username.substring(0, 2).toUpperCase()}
            </div>
            <span className="text-sm font-medium">{username}</span>
            </div>
        </div>
        </header>
    );
}