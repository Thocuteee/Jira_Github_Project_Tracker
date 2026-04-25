import { useEffect, useState } from 'react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer 
} from 'recharts';
import groupService from '@/api/group.service';
import taskService from '@/api/task.service';
import authService from '@/api/auth.service';
import { getPrimaryRole } from '@/utils/authDisplay';
import { Users, Filter, AlertCircle } from 'lucide-react';

interface TaskExecutionReportProps {
    groupId: string;
}

export default function TaskExecutionReport({ groupId }: TaskExecutionReportProps) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch members
                const rawMembers = await groupService.getMembers(groupId);
                const members = Array.isArray(rawMembers) ? rawMembers : [];
                const filteredMembers = members.filter((member: any) => {
                    const role = String(member?.roleInGroup || '').toUpperCase();
                    return role === 'MEMBER' || role === 'LEADER';
                });

                // Fetch roles
                let userRoles = [];
                try {
                    userRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
                } catch (e) {
                    console.error("Invalid userRoles in localStorage");
                }
                const primaryRole = getPrimaryRole(userRoles);

                // Fetch tasks
                const rawTasks = await taskService.getTasksByGroup(groupId, primaryRole);
                const tasks = Array.isArray(rawTasks) ? rawTasks : [];

                const memberIds = filteredMembers
                    .map((member: any) => String(member?.userId || member?.id || ''))
                    .filter(Boolean);
                let userNameMap: Record<string, string> = {};
                if (memberIds.length > 0) {
                    try {
                        userNameMap = await authService.getUserNames(memberIds);
                    } catch (nameErr) {
                        console.warn('Cannot fetch user names for allocation report:', nameErr);
                    }
                }

                const memberStats = filteredMembers.map((member: any) => {
                    if (!member || typeof member !== 'object') return null;

                    const userId = String(member.userId || member.id || '');
                    if (!userId) return null;
                    const memberTasks = tasks.filter((t: any) => t && String(t.assignedTo || '') === userId);
                    const fullName =
                        member.fullName ||
                        member.userName ||
                        member.username ||
                        userNameMap[userId] ||
                        `User ${userId.slice(0, 8)}`;

                    return {
                        userId,
                        roleInGroup: String(member.roleInGroup || '').toUpperCase(),
                        name: fullName,
                        'Hoàn thành': memberTasks.filter((t: any) => t.status === 'DONE').length,
                        'Đang làm': memberTasks.filter((t: any) => t.status === 'IN_PROGRESS').length,
                        'Chưa làm': memberTasks.filter((t: any) => t.status === 'TODO').length,
                        total: memberTasks.length
                    };
                }).filter(Boolean);

                setData(memberStats);
            } catch (err: any) {
                console.error("Error fetching task execution data:", err);
                setError("Không thể tải dữ liệu báo cáo. Vui lòng thử lại sau.");
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
            {/* Chart Section */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Users size={20} className="text-blue-600" />
                            Phân bổ công việc theo thành viên
                        </h3>
                        <p className="text-xs font-medium text-slate-500 mt-1">Chi tiết khối lượng công việc và tình trạng thực hiện của từng cá nhân</p>
                    </div>
                </div>
                
                <div className="h-[400px] w-full">
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} 
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis 
                                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} 
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip 
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ 
                                        borderRadius: '12px', 
                                        border: 'none', 
                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                        padding: '12px 16px'
                                    }}
                                />
                                <Legend 
                                    wrapperStyle={{ paddingTop: '20px' }} 
                                    iconType="circle"
                                    formatter={(value) => <span className="text-xs font-bold text-slate-500 uppercase ml-1">{value}</span>}
                                />
                                <Bar dataKey="Hoàn thành" stackId="a" fill="#10b981" barSize={35} />
                                <Bar dataKey="Đang làm" stackId="a" fill="#3b82f6" />
                                <Bar dataKey="Chưa làm" stackId="a" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full items-center justify-center text-slate-400 italic">
                            Không tìm thấy dữ liệu để hiển thị
                        </div>
                    )}
                </div>
            </div>

            {/* Table Section */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2 text-base">
                        <Filter size={16} className="text-slate-400" />
                        Bảng hiệu suất cá nhân
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-slate-400 font-bold uppercase tracking-widest text-[10px] bg-slate-50/50">
                                <th className="px-8 py-4">Họ và tên</th>
                                <th className="px-8 py-4 text-center">Tổng Task</th>
                                <th className="px-8 py-4 text-center">Đã xong</th>
                                <th className="px-8 py-4">Tỉ lệ (%)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.map((member, idx) => {
                                const rate = member.total > 0 ? Math.round((member['Hoàn thành'] / member.total) * 100) : 0;
                                const firstChar = member.name ? member.name.charAt(0) : '?';
                                return (
                                    <tr key={idx} className="group hover:bg-slate-50/80 transition-all">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs text-blue-600 bg-blue-50">
                                                    {firstChar}
                                                </div>
                                                <span className="font-bold text-slate-800">{member.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center font-semibold text-slate-600">{member.total}</td>
                                        <td className="px-8 py-5 text-center font-bold text-emerald-600">{member['Hoàn thành']}</td>
                                        <td className="px-8 py-5 min-w-[200px]">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-blue-600 rounded-full transition-all duration-1000" 
                                                        style={{ width: `${rate}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-black text-slate-900">{rate}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
