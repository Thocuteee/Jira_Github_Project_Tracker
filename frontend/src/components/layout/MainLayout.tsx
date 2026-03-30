import type { ReactNode } from 'react';
import { LayoutDashboard, Users, CheckSquare, Settings, Search, Bell } from 'lucide-react';

export default function MainLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex h-screen bg-[#f7f8f9] text-[#171c28]">
        {/* Sidebar */}
        <aside className="w-64 border-r border-gray-200 bg-white flex flex-col p-4">
            <div className="font-bold text-lg mb-8 px-2">Project Tracker</div>
            <nav className="space-y-1 flex-1">
            <NavItem icon={<LayoutDashboard size={18}/>} label="Dashboard" active />
            <NavItem icon={<Users size={18}/>} label="Groups" />
            <NavItem icon={<CheckSquare size={18}/>} label="My Tasks" />
            </nav>
            <div className="border-t pt-4">
            <NavItem icon={<Settings size={18}/>} label="Settings" />
            </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
            {/* Header */}
            <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6">
            <div className="flex items-center bg-gray-100 px-3 py-1.5 rounded-md w-80">
                <Search size={16} className="text-gray-400 mr-2" />
                <input type="text" placeholder="Search..." className="bg-transparent outline-none text-sm w-full" />
            </div>
            <div className="flex items-center gap-4">
                <Bell size={18} className="text-gray-500" />
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                AD
                </div>
            </div>
            </header>

            {/* Content */}
            <main className="p-8 overflow-y-auto">
            {children}
            </main>
        </div>
        </div>
    );
}

type NavItemProps = { icon: ReactNode; label: string; active?: boolean };

function NavItem({ icon, label, active = false }: NavItemProps) {
    return (
        <div className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer text-sm font-medium ${active ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
        {icon} {label}
        </div>
    );
}