import MainLayout from '@/components/layout/MainLayout';
import { ArrowRight, Clock3, Users, FileText, GitBranch, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toDisplayRole } from '@/utils/authDisplay';

const summaryStats = [
    { label: 'Active Groups', value: '5', icon: Users, iconBg: 'bg-blue-100 text-blue-600' },
    { label: 'Total Jira Tasks', value: '124', icon: FileText, iconBg: 'bg-sky-100 text-sky-600' },
    { label: 'Total GitHub Commits', value: '850', icon: GitBranch, iconBg: 'bg-emerald-100 text-emerald-600' },
    { label: 'Last Synced', value: 'Just now', icon: RefreshCw, iconBg: 'bg-amber-100 text-amber-600' },
];

const mockGroupProgress = [
    { id: 1, name: 'Nhóm 1 - Module Auth', progress: 85, recentTask: 'Tick xong Refresh Token' },
    { id: 2, name: 'Nhóm 2 - Module Group', progress: 60, recentTask: 'Đang làm API Get Members' },
    { id: 3, name: 'Nhóm 3 - Module Task', progress: 30, recentTask: 'Mới xong Entity Task' },
];

export default function Dashboard() {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Dashboard | Project Tracker";
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const email = params.get('email') ?? '';
        if (!email) return;

        const name = params.get('name') ?? '';
        const rolesRaw = params.get('roles') ?? '';
        const roles = rolesRaw
            .split(',')
            .map((r) => r.trim())
            .filter(Boolean);

        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', name || email.split('@')[0] || email);
        localStorage.setItem('userRoles', JSON.stringify(roles));
        localStorage.setItem('userSubtitle', toDisplayRole(roles[0]));
        window.dispatchEvent(new Event('auth-changed'));
        navigate('/dashboard', { replace: true });
    }, [navigate]);

    const [roles, setRoles] = useState<string[]>(() => {
        try {
            const raw = localStorage.getItem('userRoles');
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed.map(String) : [];
        } catch {
            return [];
        }
    });

    const userName = useMemo(() => {
        try {
            return localStorage.getItem('userName') || localStorage.getItem('userEmail') || 'User';
        } catch {
            return 'User';
        }
    }, []);

    return (
        <MainLayout>
            <div className="mb-8">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Overview</h1>
                        <p className="mt-1 text-slate-600">
                            Welcome, <span className="font-semibold text-slate-800">{userName}</span>
                        </p>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-sm text-slate-500 mr-1">Roles:</span>
                    {roles.map((r) => (
                        <span
                            key={r}
                            className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                        >
                            {toDisplayRole(r)}
                        </span>
                    ))}
                </div>
            </div>

            <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {summaryStats.map(({ label, value, icon: Icon, iconBg }) => (
                    <div
                        key={label}
                        className="flex items-center gap-4 rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm"
                    >
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
                            <Icon size={22} strokeWidth={2} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold tabular-nums text-slate-900">{value}</div>
                            <div className="text-sm text-slate-500">{label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <h2 className="mb-4 text-lg font-semibold text-slate-900">Team progress</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {mockGroupProgress.map((group) => (
                    <div
                        key={group.id}
                        className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                    >
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <h3 className="font-semibold text-slate-900">{group.name}</h3>
                            <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                                Active
                            </span>
                        </div>
                        <div className="mb-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full bg-blue-600 transition-all"
                                style={{ width: `${group.progress}%` }}
                            />
                        </div>
                        <div className="mb-4 text-right text-sm font-medium text-slate-600">
                            {group.progress}% Completed
                        </div>
                        <div className="flex items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                            <Clock3 className="h-3.5 w-3.5 shrink-0" />
                            <span>
                                Recent:{' '}
                                <span className="font-medium text-slate-700">{group.recentTask}</span>
                            </span>
                            <ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-400" />
                        </div>
                    </div>
                ))}
            </div>
        </MainLayout>
    );
}
