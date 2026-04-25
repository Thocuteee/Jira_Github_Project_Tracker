import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
    LayoutDashboard,
    ListTodo,
    Users,
    RefreshCw,
    Bell,
    Settings,
    Briefcase,
    ChevronDown,
    Search,
    Layers,
    FolderOpen,
    BarChart3
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import authService from '@/api/auth.service';
import { getPrimaryRole } from '@/utils/authDisplay';
import { useFcmContext } from '@/contexts/FcmContext';

import { useGroup } from '@/contexts/GroupContext';

export default function MainLayout({ children }: { children: ReactNode }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { selectedGroup, setSelectedGroup, myGroups, loading } = useGroup();
    const [menuOpen, setMenuOpen] = useState(false);
    const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
    const {
        unreadCount,
        notifications,
        loadingNotifications,
        isNotificationOpen,
        setIsNotificationOpen,
        fetchNotifications,
        markNotificationRead,
        markAllNotificationsRead,
    } = useFcmContext();
    const menuRef = useRef<HTMLDivElement | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const notificationRef = useRef<HTMLDivElement | null>(null);

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
            if (menuOpen && !menuRef.current?.contains(event.target as Node)) {
                setMenuOpen(false);
            }
            if (groupDropdownOpen && !dropdownRef.current?.contains(event.target as Node)) {
                setGroupDropdownOpen(false);
            }
            if (isNotificationOpen && !notificationRef.current?.contains(event.target as Node)) {
                setIsNotificationOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [groupDropdownOpen, isNotificationOpen, menuOpen, setIsNotificationOpen]);

    useEffect(() => {
        if (isNotificationOpen) {
            void fetchNotifications();
        }
    }, [fetchNotifications, isNotificationOpen]);

    const handleLogout = async () => {
        setMenuOpen(false);
        try {
            await authService.logout();
        } catch {
            // ignore
        } finally {
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userName');
            localStorage.removeItem('userSubtitle');
            localStorage.removeItem('userRoles');
            localStorage.removeItem('userId');
            localStorage.removeItem('selectedGroupId');
            window.dispatchEvent(new Event('auth-changed'));
            navigate('/login', { replace: true });
        }
    };

    const handleSelectGroup = (group: any) => {
        setSelectedGroup(group);
        setGroupDropdownOpen(false);
        navigate(`/workspace/${group.groupId}`);
    };

    const handleUserInfo = () => {
        setMenuOpen(false);
        navigate('/dashboard');
    };

    const toggleNotifications = () => {
        setIsNotificationOpen(!isNotificationOpen);
    };

    const openSettings = () => {
        setIsNotificationOpen(false);
        navigate('/notifications?tab=settings');
    };

    const initials = userName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');

    return (
        <div className="flex h-screen min-h-0 w-full bg-[#eef0f4] text-[#171c28]">
            {/* Sidebar */}
            <aside className="flex w-64 shrink-0 flex-col bg-white border-r border-slate-200/80 px-3 py-5 text-slate-700 overflow-y-auto relative">
                <div className="mb-6 flex items-center gap-3 px-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
                        P
                    </div>
                    <span className="text-lg font-semibold tracking-tight text-slate-900">Project Tracker</span>
                </div>
                
                {/* Group Selector Dropdown */}
                <div className="mb-6 px-2 relative" ref={dropdownRef}>
                    <button 
                        onClick={() => setGroupDropdownOpen(!groupDropdownOpen)}
                        className="flex w-full items-center justify-between rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    >
                        <span className="font-medium truncate">
                            {selectedGroup ? selectedGroup.groupName : 'Chọn Group'}
                        </span>
                        <ChevronDown size={16} className={`text-slate-400 transition-transform ${groupDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {groupDropdownOpen && (
                        <div className="absolute left-2 right-2 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                            {loading ? (
                                <div className="px-3 py-2 text-xs text-slate-400">Đang tải...</div>
                            ) : myGroups.length === 0 ? (
                                <div className="px-3 py-2 text-xs text-slate-400">Không có group nào</div>
                            ) : (
                                myGroups.map((group: any) => (
                                    <button
                                        key={group.groupId}
                                        onClick={() => handleSelectGroup(group)}
                                        className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                                            selectedGroup?.groupId === group.groupId 
                                                ? 'bg-slate-100 text-slate-900 font-semibold'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                    >
                                        {group.groupName}
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <nav className="flex flex-1 flex-col gap-6">
                    <div>
                        <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Hệ thống tổng quan
                        </h3>
                        <div className="flex flex-col gap-0.5">
                            <NavItem icon={<LayoutDashboard size={18} />} label="Tổng quan (Global)" to="/dashboard" active={location.pathname === '/dashboard'} />
                        </div>
                    </div>

                    {selectedGroup && (
                        <div>
                            <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-600">
                                {selectedGroup.groupName}
                            </h3>
                            <div className="flex flex-col gap-0.5">
                                <NavItem 
                                    icon={<LayoutDashboard size={18} />} 
                                    label="Dashboard Nhóm" 
                                    to={`/workspace/${selectedGroup.groupId}`} 
                                    active={location.pathname === `/workspace/${selectedGroup.groupId}`}
                                />
                                <NavItem 
                                    icon={<ListTodo size={18} />} 
                                    label="Bảng Task" 
                                    to={`/workspace/${selectedGroup.groupId}/tasks`} 
                                    active={location.pathname === `/workspace/${selectedGroup.groupId}/tasks`}
                                />
                                <NavItem 
                                    icon={<Layers size={18} />} 
                                    label="Yêu cầu (Epic)" 
                                    to="/requirements" 
                                    active={location.pathname === '/requirements'}
                                />
                                <NavItem 
                                    icon={<Users size={18} />} 
                                    label="Thành viên" 
                                    to={`/members/${selectedGroup.groupId}`} 
                                    active={location.pathname === `/members/${selectedGroup.groupId}`}
                                />
                                <NavItem
                                    icon={<FolderOpen size={18} />}
                                    label="Tài liệu"
                                    to="/files"
                                    active={location.pathname === '/files'}
                                />
                                <NavItem
                                    icon={<BarChart3 size={18} />}
                                    label="Báo cáo & Thống kê"
                                    to={`/workspace/${selectedGroup.groupId}/reports`}
                                    active={location.pathname === `/workspace/${selectedGroup.groupId}/reports`}
                                />
                                <NavItem
                                    icon={<Settings size={18} />}
                                    label="Cấu hình tích hợp"
                                    to="/settings/integrations"
                                    active={location.pathname === '/settings/integrations' || location.pathname === '/settings/github' || location.pathname === '/settings/jira'}
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Tích hợp & Hệ thống
                        </h3>
                        <div className="flex flex-col gap-0.5">
                            <NavItem icon={<RefreshCw size={18} />} label="Trung tâm Tích hợp" to="/settings/integrations" active={location.pathname === '/settings/integrations' || location.pathname === '/settings/github' || location.pathname === '/settings/jira'} />
                            <NavItem icon={<Bell size={18} />} label="Thông báo" to="/notifications" active={location.pathname === '/notifications'} />
                            <NavItem icon={<Settings size={18} />} label="Hồ sơ cá nhân" active={location.pathname === '/profile'} />
                            {(() => {
                                try {
                                    const rawRoles = localStorage.getItem('userRoles');
                                    if (rawRoles) {
                                        return JSON.parse(rawRoles).includes('ROLE_ADMIN');
                                    }
                                } catch (e) { return false; }
                                return false;                                
                            })() && (
                                <>
                                    <div className="pt-4 mt-2 border-t border-slate-100">
                                        <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-red-500">
                                            Admin Control
                                        </h3>
                                        <NavItem icon={<Users size={18} />} label="Quản lý Lecturer" to="/admin/lecturers" />
                                        <NavItem icon={<Briefcase size={18} />} label="Quản lý Workspace" to="/admin/workspace" />
                                    </div>
                                </>
                            )}
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
                        <div className="relative" ref={notificationRef}>
                            <button
                                type="button"
                                onClick={toggleNotifications}
                                className="relative rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                                aria-label="Notifications"
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-4 text-white ring-2 ring-white">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </button>
                            {isNotificationOpen && (
                                <div className="absolute right-0 top-12 z-40 w-96 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                                    <div className="mb-2 flex items-center justify-between">
                                        <h4 className="text-sm font-semibold text-slate-900">Thông báo</h4>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={openSettings}
                                                className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                                                aria-label="Notification settings"
                                            >
                                                <Settings size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => void markAllNotificationsRead()}
                                                className="text-xs font-medium text-blue-600 hover:text-blue-700"
                                            >
                                                Đánh dấu tất cả đã đọc
                                            </button>
                                        </div>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {loadingNotifications ? (
                                            <div className="p-3 text-sm text-slate-500">Đang tải thông báo...</div>
                                        ) : notifications.length === 0 ? (
                                            <div className="p-3 text-sm text-slate-500">Chưa có thông báo nào.</div>
                                        ) : (
                                            notifications.slice(0, 15).map((item) => (
                                                <button
                                                    key={item.notificationId}
                                                    type="button"
                                                    onClick={() => {
                                                        void markNotificationRead(item.notificationId);
                                                        setIsNotificationOpen(false);
                                                        navigate(`/notifications?notificationId=${item.notificationId}`);
                                                    }}
                                                    className={`mb-1 w-full rounded-lg border p-3 text-left transition ${
                                                        item.isRead
                                                            ? 'border-slate-200 bg-slate-50'
                                                            : 'border-blue-100 bg-blue-50'
                                                    }`}
                                                >
                                                    <p className={`text-sm ${item.isRead ? 'font-medium text-slate-700' : 'font-semibold text-slate-900'}`}>
                                                        {item.title}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-600">{item.message}</p>
                                                    <p className="mt-2 text-[11px] text-slate-500">
                                                        {new Date(item.createdAt).toLocaleString('vi-VN')}
                                                    </p>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
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
