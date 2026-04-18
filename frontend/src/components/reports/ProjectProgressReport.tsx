import { useEffect, useState } from 'react';
import { 
    PieChart, 
    Pie, 
    Cell, 
    ResponsiveContainer, 
    Legend, 
    Tooltip,
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid 
} from 'recharts';
import taskService from '@/api/task.service';
import requirementService from '@/api/requirement.service';
import { getPrimaryRole } from '@/utils/authDisplay';
import { 
    CheckCircle2, 
    Clock, 
    Layers,
    TrendingUp,
    AlertCircle
} from 'lucide-react';

interface ProjectProgressReportProps {
    groupId: string;
}

export default function ProjectProgressReport({ groupId }: ProjectProgressReportProps) {
    const [stats, setStats] = useState({
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        todoTasks: 0,
        data: [] as any[]
    });
    const [requirementStats, setRequirementStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                let userRoles = [];
                try {
                    userRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
                } catch (e) { console.error("Invalid userRoles"); }
                
                const primaryRole = getPrimaryRole(userRoles);
                const rawTasks = await taskService.getTasksByGroup(groupId, primaryRole);
                const tasks = Array.isArray(rawTasks) ? rawTasks : [];
                
                const total = tasks.length;
                const completed = tasks.filter((t: any) => t && t.status === 'DONE').length;
                const inProgress = tasks.filter((t: any) => t && t.status === 'IN_PROGRESS').length;
                const todo = tasks.filter((t: any) => t && t.status === 'TODO').length;

                setStats({
                    totalTasks: total,
                    completedTasks: completed,
                    inProgressTasks: inProgress,
                    todoTasks: todo,
                    data: [
                        { name: 'Hoàn thành', value: completed },
                        { name: 'Đang làm', value: inProgress },
                        { name: 'Chưa làm', value: todo }
                    ]
                });

                const res = await requirementService.getRequirementsByGroup(groupId);
                const requirements = Array.isArray(res.data) ? res.data : [];
                const reqProgress = requirements.map((req: any) => ({
                    name: req.title ? (req.title.length > 20 ? req.title.substring(0, 20) + '...' : req.title) : 'Yêu cầu không tên',
                    progress: req.progress || 0
                }));
                setRequirementStats(reqProgress);
            } catch (err) {
                console.error("Error fetching report data:", err);
                setError("Có lỗi khi tải dữ liệu tiến độ.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [groupId]);

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-96 flex-col items-center justify-center gap-3 text-red-500">
                <AlertCircle size={40} />
                <p className="font-bold">{error}</p>
            </div>
        );
    }

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b'];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-700">
            {/* Distribution Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Phân bổ trạng thái</h3>
                        <p className="text-xs font-medium text-slate-500">Tổng quan toàn bộ task trong workspace</p>
                    </div>
                </div>
                
                <div className="relative h-[300px] w-full">
                    {stats.totalTasks > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.data}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={85}
                                        outerRadius={110}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {stats.data.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={36} 
                                        iconType="circle"
                                        formatter={(value) => <span className="text-xs font-bold text-slate-600 uppercase ml-1">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pb-8 pointer-events-none">
                                <p className="text-4xl font-black text-slate-900">
                                    {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Hoàn tất</p>
                            </div>
                        </>
                    ) : (
                        <div className="flex h-full items-center justify-center text-slate-400 italic">
                            Chưa có dữ liệu task để hiển thị
                        </div>
                    )}
                </div>
            </div>

            {/* Requirement Progress */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Tiến độ Yêu cầu (Epic)</h3>
                        <p className="text-xs font-medium text-slate-500">Thống kê theo các đầu mục chính</p>
                    </div>
                </div>
                
                <div className="h-[300px] w-full">
                    {requirementStats.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={requirementStats} layout="vertical" margin={{ left: 10, right: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" domain={[0, 100]} hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    width={120} 
                                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip 
                                    formatter={(value) => [`${value}%`, 'Tiến độ']}
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar 
                                    dataKey="progress" 
                                    fill="#3b82f6" 
                                    radius={[0, 4, 4, 0]} 
                                    barSize={20}
                                    background={{ fill: '#f8fafc' }}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full items-center justify-center text-slate-400 italic">
                            Chưa có dữ liệu yêu cầu
                        </div>
                    )}
                </div>
            </div>

            {/* Overall Statistics Cards */}
            <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-6">
                <StatCard 
                    label="Tổng Task" 
                    value={stats.totalTasks} 
                    icon={<Layers size={18} />}
                    color="slate"
                />
                <StatCard 
                    label="Hoàn thành" 
                    value={stats.completedTasks} 
                    icon={<CheckCircle2 size={18} />}
                    color="emerald"
                />
                <StatCard 
                    label="Đang làm" 
                    value={stats.inProgressTasks} 
                    icon={<TrendingUp size={18} />}
                    color="blue"
                />
                <StatCard 
                    label="Còn lại" 
                    value={stats.todoTasks} 
                    icon={<Clock size={18} />}
                    color="amber"
                />
            </div>
        </div>
    );
}

function StatCard({ label, value, icon, color }: { 
    label: string, 
    value: number, 
    icon: React.ReactNode,
    color: 'slate' | 'emerald' | 'blue' | 'amber'
}) {
    const colors = {
        slate: 'text-slate-600 bg-slate-50 border-slate-100',
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        blue: 'text-blue-600 bg-blue-50 border-blue-100',
        amber: 'text-amber-600 bg-amber-50 border-amber-100'
    };

    return (
        <div className={`rounded-xl border p-5 flex flex-col transition-all hover:shadow-md hover:shadow-slate-100 bg-white`}>
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-4 border ${colors[color]}`}>
                {icon}
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
        </div>
    );
}
