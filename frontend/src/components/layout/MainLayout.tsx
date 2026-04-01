import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
    LayoutDashboard,
    Users,
    FileText,
    GitBranch,
    FileDown,
    Plug,
    Search,
    Bell,
    RefreshCw,
    Settings,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '@/api/auth.service';
import { getPrimaryRole } from '@/utils/authDisplay';

export default function MainLayout({ children }: { children: ReactNode }) {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    const authed = (() => {
        try {
            return Boolean(
                localStorage.getItem('accessToken') &&
                    (localStorage.getItem('userEmail') || localStorage.getItem('userName'))
            );
        } catch {
            return false;
        }
    })();

    const userName = (() => {
        try {
            return (
                localStorage.getItem('userName') ||
                localStorage.getItem('userEmail') ||
                'User'
            );
        } catch {
            return 'User';
        }
    })();

    const userSubtitle = (() => {
        try {
            const rawRoles = localStorage.getItem('userRoles');
            if (rawRoles) {
                const parsed = JSON.parse(rawRoles);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return getPrimaryRole(parsed.map(String));
                }
            }

            return localStorage.getItem('userSubtitle') || 'Role';
        } catch {
            return 'Role';
        }
    })();

    useEffect(() => {
        if (!menuOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (!menuRef.current?.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen]);

    const handleUserInfo = () => {
        setMenuOpen(false);
        alert(`Tên: ${userName}\nEmail: ${localStorage.getItem('userEmail') || '-'}\nVai trò: ${userSubtitle}`);
    };

    const handleLogout = async () => {
        setMenuOpen(false);
        try {
            await authService.logout();
        } catch {
            // Nếu BE logout lỗi thì vẫn clear local state để người dùng thoát phiên.
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userName');
            localStorage.removeItem('userSubtitle');
            localStorage.removeItem('userRoles');
            localStorage.removeItem('refreshToken');
            window.dispatchEvent(new Event('auth-changed'));
            navigate('/login', { replace: true });
        }
    };

    const initials = userName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');

    return (
        <div className="flex h-screen min-h-0 w-full bg-[#eef0f4] text-[#171c28]">
            <aside className="flex w-64 shrink-0 flex-col bg-[#111827] px-3 py-5 text-slate-200">
                <div className="mb-8 flex items-center gap-3 px-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
                        S
                    </div>
                    <span className="text-lg font-semibold tracking-tight text-white">SEOOP Tracker</span>
                </div>
                <nav className="flex flex-1 flex-col gap-0.5">
                    <NavItem icon={<LayoutDashboard size={18} />} label="Overview" active />
                    <NavItem icon={<Users size={18} />} label="Group Management" />
                    <NavItem icon={<FileText size={18} />} label="Jira Requirements" />
                    <NavItem icon={<GitBranch size={18} />} label="GitHub Analytics" />
                    <NavItem icon={<FileDown size={18} />} label="Export SRS Document" />
                    <NavItem icon={<Plug size={18} />} label="Integration Settings" />
                </nav>
                <div className="mt-auto border-t border-slate-700/80 pt-4">
                    <NavItem icon={<Settings size={18} />} label="Settings" />
                </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="flex h-[60px] shrink-0 items-center justify-between gap-6 border-b border-slate-200/80 bg-white px-6 shadow-sm">
                    <div className="flex min-w-0 flex-1 items-center">
                        <div className="flex max-w-2xl flex-1 items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5">
                            <Search size={18} className="shrink-0 text-slate-400" />
                            <input
                                type="search"
                                placeholder="Search groups, tasks, commits..."
                                className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-5">
                        <div className="hidden items-center gap-2 sm:flex">
                            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30" />
                            <span className="text-sm text-slate-600">Real-time Syncing</span>
                            <button
                                type="button"
                                className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                                aria-label="Refresh sync"
                            >
                                <RefreshCw size={18} />
                            </button>
                        </div>
                        <button
                            type="button"
                            className="relative rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                            aria-label="Notifications"
                        >
                            <Bell size={20} />
                            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                        </button>
                        {authed ? (
                            <div className="relative flex items-center gap-3 border-l border-slate-200 pl-5" ref={menuRef}>
                                <div className="hidden text-right sm:block">
                                    <div className="text-sm font-semibold text-slate-900">{userName}</div>
                                    <div className="text-xs text-slate-500">{userSubtitle}</div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setMenuOpen((prev) => !prev)}
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700"
                                    aria-label="Mở menu người dùng"
                                >
                                    {initials || 'U'}
                                </button>
                                {menuOpen ? (
                                    <div className="absolute right-0 top-12 z-20 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                                        <button
                                            type="button"
                                            onClick={handleUserInfo}
                                            className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                                        >
                                            Thông tin người dùng
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
                                        >
                                            Đăng xuất
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 border-l border-slate-200 pl-5">
                                <Link
                                    to="/login"
                                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                                >
                                    Đăng nhập
                                </Link>
                            </div>
                        )}
                    </div>
                </header>

                <main className="min-h-0 flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
            </div>
        </div>
    );
}

type NavItemProps = { icon: ReactNode; label: string; active?: boolean };

function NavItem({ icon, label, active = false }: NavItemProps) {
    return (
        <div
            className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
            }`}
        >
            <span className="shrink-0 opacity-90">{icon}</span>
            {label}
        </div>
    );
}
