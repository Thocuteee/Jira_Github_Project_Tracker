import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
    LayoutDashboard,
    ListTodo,
    Layers,
    Users,
    RefreshCw,
    Bell,
    Settings,
    Briefcase,
    ChevronDown,
    Search
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import authService from '@/api/auth.service';
import { getPrimaryRole } from '@/utils/authDisplay';
import { useGroupContext } from '@/contexts/GroupContext';

export default function MainLayout({ children }: { children: ReactNode }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const groupDropdownRef = useRef<HTMLDivElement | null>(null);
    const { groups, selectedGroup, setSelectedGroup, loading: groupsLoading } = useGroupContext();

    const authed = (() => {
        try {
            return Boolean(localStorage.getItem('userEmail') || localStorage.getItem('userName'));
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
        const handleClickOutside = (event: MouseEvent) => {
            if (menuOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
            if (groupDropdownOpen && groupDropdownRef.current && !groupDropdownRef.current.contains(event.target as Node)) {
                setGroupDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen, groupDropdownOpen]);

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
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userName');
            localStorage.removeItem('userSubtitle');
            localStorage.removeItem('userRoles');
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

    const isActive = (path: string) => location.pathname.startsWith(path);

    return (
        <div className="flex h-screen min-h-0 w-full bg-[#eef0f4] text-[#171c28]">
            <aside className="flex w-64 shrink-0 flex-col bg-white border-r border-slate-200/80 px-3 py-5 text-slate-700 overflow-y-auto">
                <div className="mb-6 flex items-center gap-3 px-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
                        P
                    </div>
                    <span className="text-lg font-semibold tracking-tight text-slate-900">Project Tracker</span>
                </div>
                
                <div className="mb-6 px-2 relative" ref={groupDropdownRef}>
                    <button 
                        onClick={() => setGroupDropdownOpen(!groupDropdownOpen)}
                        className="flex w-full items-center justify-between rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                        <span className="font-medium truncate">
                            {groupsLoading ? 'Đang tải...' : (selectedGroup?.groupName || 'Chọn Group')}
                        </span>
                        <ChevronDown size={16} className={`text-slate-400 transition-transform ${groupDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {groupDropdownOpen && (
                        <div className="absolute top-12 left-2 right-2 z-20 rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg max-h-60 overflow-y-auto">
                            {groups && groups.length > 0 ? (
                                groups.map(group => (
                                    <button
                                        key={group.groupId}
                                        onClick={() => {
                                            setSelectedGroup(group);
                                            setGroupDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${selectedGroup?.groupId === group.groupId ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                                    >
                                        <div className="truncate">{group.groupName}</div>
                                    </button>
                                ))
                            ) : (
                                <div className="px-3 py-2 text-sm text-slate-500 italic">Không có group nào</div>
                            )}
                        </div>
                    )}
                </div>

                <nav className="flex flex-1 flex-col gap-6">
                    <div>
                        <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Dự án của tôi
                        </h3>
                        <div className="flex flex-col gap-0.5">
                            <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active={isActive('/dashboard')} to="/dashboard" />
                            <NavItem icon={<ListTodo size={18} />} label="Bảng Task" active={isActive('/tasks')} to="/tasks" />
                            <NavItem icon={<Layers size={18} />} label="Yêu cầu (Epic)" active={isActive('/requirements')} to="/requirements" />
                            <NavItem icon={<Users size={18} />} label="Thành viên nhóm" active={isActive('/members')} to="/members" />
                        </div>
                    </div>

                    <div>
                        <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Tích hợp
                        </h3>
                        <div className="flex flex-col gap-0.5">
                            <NavItem icon={<RefreshCw size={18} />} label="Trung tâm Tích hợp" to="/settings/integrations" />
                        </div>
                    </div>

                    <div className="mt-auto">
                        <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Hệ thống
                        </h3>
                        <div className="flex flex-col gap-0.5">
                            <NavItem icon={<Bell size={18} />} label="Thông báo" active={isActive('/notifications')} to="/notifications" />
                            <NavItem icon={<Settings size={18} />} label="Cấu hình cá nhân" active={isActive('/profile')} to="/profile" />
                            {(() => {
                                try {
                                    const rawRoles = localStorage.getItem('userRoles');
                                    if (rawRoles) {
                                        const parsed = JSON.parse(rawRoles);
                                        return Array.isArray(parsed) && parsed.map(String).includes('ROLE_ADMIN');
                                    }
                                } catch (e) {
                                    return false;
                                }
                                return false;                                
                            })() && (
                                <NavItem icon={<Users size={18} />} label="Quản lý Lecturer" active={isActive('/admin/lecturers')} to="/admin/lecturers" />
                            )}
                            <NavItem icon={<Briefcase size={18} />} label="Quản lý Workspace" active={isActive('/workspaces')} to="/workspaces" />
                        </div>
                    </div>
                </nav>
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

type NavItemProps = { icon: ReactNode; label: string; active?: boolean; to?: string };

function NavItem({ icon, label, active = false, to }: NavItemProps) {
    const content = (
        <>
            <span className="shrink-0 opacity-90">{icon}</span>
            {label}
        </>
    );
    const className = `flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        active
            ? 'bg-blue-50 text-blue-700'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

    if (to) {
        return <Link to={to} className={className}>{content}</Link>;
    }

    return <div className={className}>{content}</div>;
}
