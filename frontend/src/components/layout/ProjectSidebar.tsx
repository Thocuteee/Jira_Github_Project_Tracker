import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, ListTodo, Layers, Users, Settings } from 'lucide-react';

interface ProjectSidebarProps {
    groupId: string;
    activeTab: 'dashboard' | 'tasks' | 'requirements' | 'members' | 'settings';
}

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({ groupId, activeTab }) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, to: `/workspace/${groupId}` },
        { id: 'requirements', label: 'Yêu cầu dự án', icon: <Layers size={20} />, to: `/workspace/${groupId}/requirements` },
        { id: 'tasks', label: 'Bảng công việc', icon: <ListTodo size={20} />, to: `/tasks?groupId=${groupId}` },
        { id: 'members', label: 'Thành viên', icon: <Users size={20} />, to: `/members?groupId=${groupId}` },
        { id: 'settings', label: 'Cấu hình GitHub', icon: <Settings size={20} />, to: `/settings?groupId=${groupId}` },
    ];

    return (
        <aside className="w-64 border-r border-slate-200 bg-slate-50/50 p-6 flex flex-col gap-8 shrink-0 h-screen sticky top-0">
            <div className="flex items-center gap-3 px-2">
                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold italic">PM</div>
                <div className="font-bold text-slate-800 text-xl tracking-tight">Project Manager</div>
            </div>
            
            <nav className="flex flex-col gap-1.5 font-sans">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <Link 
                            key={item.id}
                            to={item.to} 
                            className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
                                isActive 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 font-semibold' 
                                : 'text-slate-600 hover:bg-white hover:text-blue-600 hover:shadow-sm'
                            }`}
                        >
                            <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`}>
                                {item.icon}
                            </span>
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto px-2">
                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">Project Progress</p>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 w-2/3 rounded-full"></div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default ProjectSidebar;
