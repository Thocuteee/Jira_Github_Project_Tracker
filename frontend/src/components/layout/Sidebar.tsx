import { 
    LayoutDashboard, 
    ListTodo, 
    Layers, 
    Users, 
    GitBranch, 
    RefreshCw, 
    Bell, 
    Settings, 
    Briefcase,
    ChevronDown 
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useGroupContext } from '@/contexts/GroupContext';

const myProjectNav = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Bảng Task', icon: ListTodo, href: '/tasks' },
    { name: 'Yêu cầu (Epic)', icon: Layers, href: '/requirements' },
    { name: 'Thành viên nhóm', icon: Users, href: '/members' },
];

const integrationNav = [
    { name: 'GitHub Settings', icon: GitBranch, href: '/settings/github' },
    { name: 'Jira Sync', icon: RefreshCw, href: '/settings/jira' },
];

const systemNav = [
    { name: 'Thông báo', icon: Bell, href: '/notifications' },
    { name: 'Cấu hình cá nhân', icon: Settings, href: '/profile' },
    { name: 'Quản lý Workspace', icon: Briefcase, href: '/workspaces' },
];

export default function Sidebar() {
    const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
    const groupDropdownRef = useRef<HTMLDivElement | null>(null);
    const { groups, selectedGroup, setSelectedGroup, loading: groupsLoading } = useGroupContext();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (groupDropdownOpen && groupDropdownRef.current && !groupDropdownRef.current.contains(event.target as Node)) {
                setGroupDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [groupDropdownOpen]);

    return (
        <aside className="w-64 bg-slate-100 border-r border-slate-200 flex flex-col p-4 h-full overflow-y-auto">
            {/* Logo hoặc tên App */}
            <div className="text-xl font-bold text-slate-950 mb-6 px-2">Project Tracker</div>
            
            {/* Dropdown: Chọn Group */}
            <div className="mb-6 px-2 relative" ref={groupDropdownRef}>
                <button 
                    onClick={() => setGroupDropdownOpen(!groupDropdownOpen)}
                    className="w-full flex items-center justify-between bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                >
                    <span className="font-medium truncate">
                        {groupsLoading ? 'Đang tải...' : (selectedGroup?.groupName || 'Chọn Group')}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${groupDropdownOpen ? 'rotate-180' : ''}`} />
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

            {/* DỰ ÁN CỦA TÔI */}
            <div className="mb-6">
                <h3 className="text-xs font-semibold text-slate-500 uppercase px-3 mb-2">Dự án của tôi</h3>
                <nav className="space-y-1">
                    {myProjectNav.map((item) => (
                        <a key={item.name} href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-200 hover:text-slate-950 transition-colors">
                            <item.icon className="w-4 h-4" />
                            {item.name}
                        </a>
                    ))}
                </nav>
            </div>

            {/* TÍCH HỢP */}
            <div className="mb-6">
                <h3 className="text-xs font-semibold text-slate-500 uppercase px-3 mb-2">Tích hợp</h3>
                <nav className="space-y-1">
                    {integrationNav.map((item) => (
                        <a key={item.name} href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-200 hover:text-slate-950 transition-colors">
                            <item.icon className="w-4 h-4" />
                            {item.name}
                        </a>
                    ))}
                </nav>
            </div>

            {/* HỆ THỐNG */}
            <div className="mt-auto">
                <h3 className="text-xs font-semibold text-slate-500 uppercase px-3 mb-2">Hệ thống</h3>
                <nav className="space-y-1">
                    {systemNav.map((item) => (
                        <a key={item.name} href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-200 hover:text-slate-950 transition-colors">
                            <item.icon className="w-4 h-4" />
                            {item.name}
                        </a>
                    ))}
                </nav>
            </div>
        </aside>
    );
}