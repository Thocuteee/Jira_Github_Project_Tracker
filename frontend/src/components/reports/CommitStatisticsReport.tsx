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
import { GitCommit, TrendingUp, Users, AlertCircle, Download, FileText, History, ExternalLink } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CommitStatisticsReportProps {
    groupId: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];

export default function CommitStatisticsReport({ groupId }: CommitStatisticsReportProps) {
    const [stats, setStats] = useState<any>({
        totalCommits: 0,
        timelineData: [],
        memberData: [],
        allCommits: []
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

                // Process all commits for history table
                const processedCommits = commits.map((c: any) => ({
                    id: c.commitHash || c.id || Math.random().toString(),
                    author: memberMap[c.userId] || 'GitHub Author',
                    message: c.message || 'No message',
                    date: c.committedAt ? new Date(c.committedAt).toLocaleString('vi-VN') : 'Unknown',
                    hash: c.commitHash ? c.commitHash.substring(0, 7) : '',
                    url: c.commitHash ? `https://github.com/commit/${c.commitHash}` : '#'
                })).sort((a, b) => {
                    const dateA = a.date !== 'Unknown' ? new Date(a.date.split(' ')[1].split('/').reverse().join('-') + 'T' + a.date.split(' ')[0]).getTime() : 0;
                    const dateB = b.date !== 'Unknown' ? new Date(b.date.split(' ')[1].split('/').reverse().join('-') + 'T' + b.date.split(' ')[0]).getTime() : 0;
                    return dateB - dateA;
                });

                setStats({
                    totalCommits,
                    timelineData,
                    memberData,
                    allCommits: processedCommits
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

    const handleExportCSV = () => {
        if (!stats.memberData.length && !stats.allCommits.length) return;
        
        const rankingHeaders = ['Hạng', 'Họ và tên', 'Tổng Commit'];
        const rankingRows = [...stats.memberData]
            .sort((a: any, b: any) => b.value - a.value)
            .map((member: any, idx: number) => [
                idx + 1,
                `"${member.name}"`,
                member.value
            ].join(','));
            
        const historyHeaders = ['Thời gian', 'Họ và tên', 'Mã Commit', 'Nội dung'];
        const historyRows = stats.allCommits.map((c: any) => [
            `"${c.date}"`,
            `"${c.author}"`,
            c.hash,
            `"${c.message.replace(/"/g, '""')}"`
        ].join(','));
        
        const csvContent = '\uFEFF' + 
            'BẢNG XẾP HẠNG HOẠT ĐỘNG\n' +
            [rankingHeaders.join(','), ...rankingRows].join('\n') + '\n\n' +
            'LỊCH SỬ COMMIT CHI TIẾT\n' +
            [historyHeaders.join(','), ...historyRows].join('\n');
            
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `bao_cao_github_${groupId}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        if (!stats.memberData.length && !stats.allCommits.length) return;
        
        const doc = new jsPDF();
        
        doc.setFontSize(16);
        doc.text("Bao cao danh gia hoat dong GitHub", 14, 20);
        doc.setFontSize(11);
        doc.text(`Group ID: ${groupId}`, 14, 28);
        doc.text(`Ngay xuat: ${new Date().toLocaleDateString('vi-VN')}`, 14, 34);
        
        // Bảng 1: Xếp hạng
        doc.setFontSize(12);
        doc.text("1. Bang xep hang dong gop", 14, 45);
        
        const rankingCol = ["Hang", "Ho va ten", "Tong Commit"];
        const rankingRows = [...stats.memberData]
            .sort((a: any, b: any) => b.value - a.value)
            .map((member: any, idx: number) => {
                const unaccentedName = member.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
                return [idx + 1, unaccentedName, member.value];
            });

        autoTable(doc, {
            head: [rankingCol],
            body: rankingRows,
            startY: 50,
            theme: 'grid',
            styles: { fontSize: 10 },
            headStyles: { fillColor: [59, 130, 246] }
        });

        // Bảng 2: Lịch sử commit
        const finalY = (doc as any).lastAutoTable.finalY || 50;
        doc.text("2. Lich su commit chi tiet", 14, finalY + 15);
        
        const historyCol = ["Thoi gian", "Ho va ten", "Ma Commit", "Noi dung"];
        const historyRows = stats.allCommits.map((c: any) => {
            const unaccentedName = c.author.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
            const unaccentedMsg = c.message.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
            return [c.date, unaccentedName, c.hash, unaccentedMsg];
        });

        autoTable(doc, {
            head: [historyCol],
            body: historyRows,
            startY: finalY + 20,
            theme: 'grid',
            styles: { fontSize: 9 },
            headStyles: { fillColor: [59, 130, 246] },
            columnStyles: { 3: { cellWidth: 80 } }
        });

        doc.save(`bao_cao_github_${groupId}.pdf`);
    };

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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div /> {/* Spacer */}
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleExportCSV}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 text-sm font-bold hover:bg-emerald-100 transition-all shadow-sm"
                    >
                        <FileText size={16} /> Xuất Excel
                    </button>
                    <button 
                        onClick={handleExportPDF}
                        className="inline-flex items-center gap-2 rounded-lg bg-red-50 text-red-700 border border-red-200 px-4 py-2 text-sm font-bold hover:bg-red-100 transition-all shadow-sm"
                    >
                        <Download size={16} /> Xuất PDF
                    </button>
                </div>
            </div>

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

            {/* Commit History Table */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                    <div>
                        <h3 className="font-bold text-slate-900 flex items-center gap-2 text-base">
                            <History size={18} className="text-blue-600" />
                            Lịch sử Commit chi tiết
                        </h3>
                        <p className="text-xs font-medium text-slate-500 mt-1">
                            Phục vụ đánh giá chất lượng mã nguồn (thời gian, nội dung commit)
                        </p>
                    </div>
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm shadow-sm">
                            <tr className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                                <th className="px-6 py-4">Thời gian</th>
                                <th className="px-6 py-4">Tác giả</th>
                                <th className="px-6 py-4">Commit Hash</th>
                                <th className="px-6 py-4">Nội dung (Message)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {stats.allCommits.length > 0 ? (
                                stats.allCommits.map((commit: any) => (
                                    <tr key={commit.id} className="group hover:bg-blue-50/30 transition-all">
                                        <td className="px-6 py-4 text-xs font-semibold text-slate-500 whitespace-nowrap">
                                            {commit.date}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-bold text-xs">
                                                {commit.author}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <a 
                                                href={commit.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 font-mono text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline bg-blue-50 px-2 py-0.5 rounded"
                                            >
                                                {commit.hash}
                                                <ExternalLink size={10} />
                                            </a>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-700 max-w-md break-words">
                                            {commit.message}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">
                                        Không có dữ liệu lịch sử commit
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
