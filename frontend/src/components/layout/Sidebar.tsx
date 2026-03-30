import { LayoutDashboard, Users, Clock3, Settings } from 'lucide-react'; // Dùng lucide-react cho icon

const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { name: 'Teams', icon: Users, href: '/teams' },
    { name: 'Recent', icon: Clock3, href: '/recent' },
    { name: 'Settings', icon: Settings, href: '/settings' },
];

// Mock data cho danh sách Project/Requirement
const mockProjects = [
    { id: 1, name: 'Engine' },
    { id: 2, name: 'Mobile App' },
    { id: 3, name: 'Web Portal' },
];

export default function Sidebar() {
    return (
        <aside className="w-64 bg-slate-100 border-r border-slate-200 flex flex-col p-4">
        {/* Logo hoặc tên App */}
        <div className="text-xl font-bold text-slate-950 mb-8 px-2">Project Tracker</div>
        
        {/* Navigation chính */}
        <nav className="space-y-1">
            {navItems.map((item) => (
            <a key={item.name} href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-200 hover:text-slate-950 transition-colors">
                <item.icon className="w-5 h-5" />
                {item.name}
            </a>
            ))}
        </nav>

        {/* Danh sách Project (Mock Data) */}
        <div className="mt-10">
            <h3 className="text-xs font-semibold text-slate-500 uppercase px-3 mb-2">Projects</h3>
            <div className="space-y-1">
            {mockProjects.map((project) => (
                <a key={project.id} href={`/projects/${project.id}`} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-slate-700 hover:bg-slate-200 hover:text-slate-950 transition-colors">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                {project.name}
                </a>
            ))}
            </div>
        </div>
        </aside>
    );
}