import { useEffect, useState } from 'react';
import { 
    AreaChart,
    Area,
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    Legend
} from 'recharts';
import groupService from '@/api/group.service';
import githubService from '@/api/github.service';
import { GitCommit, TrendingUp, Users, AlertCircle } from 'lucide-react';

interface CommitStatisticsReportProps {
    groupId: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];

export default function CommitStatisticsReport({ groupId }: CommitStatisticsReportProps) {
    const [stats, setStats] = useState<any>({
        totalCommits: 0,
        timelineData: [],
        memberData: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Get members for name mapping
                const rawMembers = await groupService.getMembers(groupId);
                const members = Array.isArray(rawMembers) ? rawMembers : [];
                
                const memberMap: Record<string, string> = {};
                members.forEach((m: any) => {
                    if (m && m.userId) {
                        memberMap[m.userId] = m.userName || m.email || 'Thành viên mới';
                    }
                });

                const rawCommits = await githubService.getCommitsByGroup(groupId);
                const commits = Array.isArray(rawCommits) ? rawCommits : [];
                
                // Aggregate processing
                const totalCommits = commits.length;
                const dailyAgg: Record<string, number> = {};
                const contribAgg: Record<string, number> = {};

                commits.forEach((c: any) => {
                    if (!c) return;
                    
                    // Timeline aggregation (daily)
                    if (c.committedAt) {
                        try {
                            const date = new Date(c.committedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                            dailyAgg[date] = (dailyAgg[date] || 0) + 1;
                        } catch (e) { /* ignore invalid dates */ }
                    }

                    // Member aggregation
                    const userName = memberMap[c.userId] || 'GitHub Author';
                    contribAgg[userName] = (contribAgg[userName] || 0) + 1;
                });

                // Format for charts
                const timelineData = Object.entries(dailyAgg).map(([date, count]) => ({
                    date,
                    commits: count
                })).sort((a, b) => a.date.localeCompare(b.date));

                const memberData = Object.entries(contribAgg).map(([name, value]) => ({
                    name,
                    value
                }));

                setStats({
                    totalCommits,
                    timelineData,
                    memberData
                });
            } catch (err) {
                console.error("Error fetching commit statistics:", err);
                setError("Có lỗi khi kết nối với dữ liệu GitHub.");
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

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                            <GitCommit size={18} />
                        </div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tổng Commit</h4>
                    </div>
                    <p className="text-2xl font-black text-slate-900">{stats.totalCommits}</p>
                </div>
                
                <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                            <TrendingUp size={18} />
                        </div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tần suất hoạt động</h4>
                    </div>
                    <div className="h-[120px] w-full">
                        {stats.timelineData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.timelineData}>
                                    <defs>
                                        <linearGradient id="colorCommits" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" hide />
                                    <YAxis hide />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="commits" 
                                        stroke="#3b82f6" 
                                        strokeWidth={3}
                                        fillOpacity={1} 
                                        fill="url(#colorCommits)" 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                             <div className="flex h-full items-center justify-center text-slate-400 italic text-xs">
                                Chưa có dòng thời gian hoạt động
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Distribution Chart */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-slate-900">Tỉ trọng đóng góp</h3>
                        <p className="text-xs font-medium text-slate-500">Phân bố mã nguồn theo thành viên GitHub</p>
                    </div>
                    <div className="h-[300px] w-full">
                        {stats.memberData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.memberData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={75}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {stats.memberData.map((_: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend 
                                        iconType="circle" 
                                        formatter={(value) => <span className="text-xs font-bold text-slate-600 uppercase ml-1">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-slate-400 italic">
                                Không tìm thấy dữ liệu đóng góp GitHub
                            </div>
                        )}
                    </div>
                </div>

                {/* List Ranking */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Xếp hạng hoạt động</h3>
                            <p className="text-xs font-medium text-slate-500">Dựa trên số lượng commit</p>
                        </div>
                        <Users size={20} className="text-slate-400" />
                    </div>
                    <div className="space-y-3">
                        {stats.memberData.length > 0 ? (
                            [...stats.memberData].sort((a: any, b: any) => b.value - a.value).map((member: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-slate-50 transition-all hover:border-slate-200 hover:bg-white">
                                    <div className="flex items-center gap-3">
                                        <div className="h-7 w-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                            #{idx + 1}
                                        </div>
                                        <span className="font-bold text-slate-700">{member.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-black text-slate-900">{member.value}</span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Commits</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-10 text-center text-slate-400 italic text-sm">
                                Chưa có dữ liệu bảng xếp hạng
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
