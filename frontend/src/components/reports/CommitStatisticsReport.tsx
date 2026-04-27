import { useEffect, useMemo, useState } from 'react';
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
    Legend,
} from 'recharts';
import groupService from '@/api/group.service';
import githubService from '@/api/github.service';
import {
    GitCommit,
    TrendingUp,
    Users,
    AlertCircle,
    Clock,
    Calendar,
    Link2,
    Inbox,
} from 'lucide-react';

interface CommitStatisticsReportProps {
    groupId: string;
}

interface CommitDto {
    commitId?: string;
    groupId?: string;
    repoId?: string;
    repoName?: string;
    userId?: string;
    commitHash?: string;
    message?: string;
    commitFile?: string;
    committedAt?: string;
}

interface MemberDto {
    userId?: string;
    id?: string;
    userName?: string;
    fullName?: string;
    email?: string;
}

interface TimelinePoint {
    date: string;
    isoDate: string;
    commits: number;
}

interface MemberStat {
    name: string;
    value: number;
}

interface Stats {
    totalCommits: number;
    totalContributors: number;
    avgCommitsPerActiveDay: number;
    latestCommit: CommitDto | null;
    timelineData: TimelinePoint[];
    memberData: MemberStat[];
    repoCount: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];
const EMPTY_STATS: Stats = {
    totalCommits: 0,
    totalContributors: 0,
    avgCommitsPerActiveDay: 0,
    latestCommit: null,
    timelineData: [],
    memberData: [],
    repoCount: 0,
};

function buildMemberMap(members: MemberDto[]): Record<string, string> {
    const map: Record<string, string> = {};
    for (const m of members) {
        const id = m?.userId || m?.id;
        if (!id) continue;
        map[id] = m.fullName || m.userName || m.email || 'Thành viên';
    }
    return map;
}

function aggregateCommits(commits: CommitDto[], memberMap: Record<string, string>): Stats {
    if (commits.length === 0) return { ...EMPTY_STATS };

    const dailyAgg = new Map<string, number>();
    const contribAgg = new Map<string, number>();
    const repos = new Set<string>();
    let latest: CommitDto | null = null;
    let latestTs = 0;

    for (const c of commits) {
        if (!c) continue;

        if (c.repoId) repos.add(c.repoId);

        if (c.committedAt) {
            const ts = new Date(c.committedAt).getTime();
            if (!Number.isNaN(ts)) {
                const isoDate = new Date(ts).toISOString().slice(0, 10);
                dailyAgg.set(isoDate, (dailyAgg.get(isoDate) || 0) + 1);
                if (ts > latestTs) {
                    latestTs = ts;
                    latest = c;
                }
            }
        } else if (!latest) {
            latest = c;
        }

        const key = c.userId ? memberMap[c.userId] || `Unknown (${c.userId.slice(0, 6)})` : 'GitHub Author';
        contribAgg.set(key, (contribAgg.get(key) || 0) + 1);
    }

    const timelineData = Array.from(dailyAgg.entries())
        .map(([isoDate, count]) => ({
            isoDate,
            date: new Date(isoDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
            commits: count,
        }))
        .sort((a, b) => a.isoDate.localeCompare(b.isoDate));

    const memberData = Array.from(contribAgg.entries()).map(([name, value]) => ({ name, value }));

    const activeDays = timelineData.length;
    const avgCommitsPerActiveDay = activeDays > 0 ? Math.round((commits.length / activeDays) * 10) / 10 : 0;

    return {
        totalCommits: commits.length,
        totalContributors: memberData.length,
        avgCommitsPerActiveDay,
        latestCommit: latest,
        timelineData,
        memberData,
        repoCount: repos.size,
    };
}

export default function CommitStatisticsReport({ groupId }: CommitStatisticsReportProps) {
    const [stats, setStats] = useState<Stats>(EMPTY_STATS);
    const [recentCommits, setRecentCommits] = useState<CommitDto[]>([]);
    const [memberMap, setMemberMap] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!groupId) return;
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const rawMembers = (await groupService.getMembers(groupId).catch((err) => {
                    console.warn('Cannot fetch members for commit stats:', err);
                    return [];
                })) as MemberDto[] | null;
                const members = Array.isArray(rawMembers) ? rawMembers : [];
                const map = buildMemberMap(members);
                setMemberMap(map);

                const rawCommits = (await githubService.getCommitsByGroup(groupId)) as CommitDto[] | null;
                const commits = Array.isArray(rawCommits) ? rawCommits : [];

                const aggregated = aggregateCommits(commits, map);
                setStats(aggregated);

                const sortedRecent = commits
                    .filter((c) => c.committedAt)
                    .sort((a, b) => new Date(b.committedAt as string).getTime() - new Date(a.committedAt as string).getTime())
                    .slice(0, 5);
                setRecentCommits(sortedRecent);
            } catch (err) {
                console.error('Error fetching commit statistics:', err);
                setError('Có lỗi khi kết nối với dữ liệu GitHub. Vui lòng kiểm tra cấu hình tích hợp hoặc thử lại sau.');
                setStats(EMPTY_STATS);
                setRecentCommits([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [groupId]);

    const dateRangeLabel = useMemo(() => {
        if (stats.timelineData.length === 0) return null;
        const first = stats.timelineData[0];
        const last = stats.timelineData[stats.timelineData.length - 1];
        return `${first.date} - ${last.date}`;
    }, [stats.timelineData]);

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

    if (stats.totalCommits === 0) {
        return (
            <div className="flex h-96 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-white/50">
                <Inbox size={48} className="text-slate-300" />
                <div className="text-center">
                    <h2 className="text-lg font-bold text-slate-700">Chưa ghi nhận commit nào</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Hãy đảm bảo nhóm đã liên kết repo GitHub và đã có dữ liệu commit được đồng bộ.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard label="Tổng commit" value={stats.totalCommits} icon={<GitCommit size={18} />} accent="blue" />
                <KpiCard label="Người đóng góp" value={stats.totalContributors} icon={<Users size={18} />} accent="emerald" />
                <KpiCard label="Repo theo dõi" value={stats.repoCount} icon={<Link2 size={18} />} accent="slate" />
                <KpiCard
                    label="TB commit/ngày HĐ"
                    value={stats.avgCommitsPerActiveDay}
                    icon={<TrendingUp size={18} />}
                    accent="amber"
                />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <TrendingUp size={18} className="text-emerald-600" /> Tần suất hoạt động
                        </h3>
                        <p className="text-xs font-medium text-slate-500 mt-1">Commit theo từng ngày</p>
                    </div>
                    {dateRangeLabel && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded-md px-2 py-1">
                            <Calendar size={12} /> {dateRangeLabel}
                        </span>
                    )}
                </div>
                <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.timelineData}>
                            <defs>
                                <linearGradient id="colorCommits" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            <Area type="monotone" dataKey="commits" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCommits)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-slate-900">Tỉ trọng đóng góp</h3>
                        <p className="text-xs font-medium text-slate-500">Phân bố commit theo thành viên</p>
                    </div>
                    <div className="h-[300px] w-full">
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
                                    {stats.memberData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Legend
                                    iconType="circle"
                                    formatter={(value) => <span className="text-xs font-bold text-slate-600 ml-1">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Xếp hạng hoạt động</h3>
                            <p className="text-xs font-medium text-slate-500">Dựa trên số lượng commit</p>
                        </div>
                        <Users size={20} className="text-slate-400" />
                    </div>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {[...stats.memberData]
                            .sort((a, b) => b.value - a.value)
                            .map((member, idx) => (
                                <div
                                    key={`${member.name}-${idx}`}
                                    className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-slate-50 transition-all hover:border-slate-200 hover:bg-white"
                                >
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
                            ))}
                    </div>
                </div>
            </div>

            {recentCommits.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Clock size={18} className="text-blue-600" /> Commit gần nhất
                            </h3>
                            <p className="text-xs font-medium text-slate-500 mt-1">Top 5 commit mới nhất của nhóm</p>
                        </div>
                    </div>
                    <ul className="divide-y divide-slate-100">
                        {recentCommits.map((c) => {
                            const author = c.userId ? memberMap[c.userId] || `Unknown (${c.userId.slice(0, 6)})` : 'GitHub Author';
                            const when = c.committedAt ? new Date(c.committedAt).toLocaleString('vi-VN') : '-';
                            const message = (c.message || '').split('\n')[0] || 'No message';
                            return (
                                <li key={c.commitId || c.commitHash} className="py-3 flex items-start gap-3">
                                    <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                                        <GitCommit size={14} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">{message}</p>
                                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                                            <span className="font-bold text-slate-700">{author}</span>
                                            <span className="text-slate-300">•</span>
                                            <span>{when}</span>
                                            {c.repoName && (
                                                <>
                                                    <span className="text-slate-300">•</span>
                                                    <span className="font-mono text-[11px] bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">{c.repoName}</span>
                                                </>
                                            )}
                                            {c.commitHash && (
                                                <>
                                                    <span className="text-slate-300">•</span>
                                                    <span className="font-mono text-[11px] text-slate-400">{c.commitHash.slice(0, 7)}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            {stats.latestCommit && stats.latestCommit.committedAt && recentCommits.length === 0 && (
                <p className="text-xs text-slate-400 italic">Lần cập nhật cuối: {new Date(stats.latestCommit.committedAt).toLocaleString('vi-VN')}</p>
            )}
        </div>
    );
}

function KpiCard({
    label,
    value,
    icon,
    accent,
}: {
    label: string;
    value: number;
    icon: React.ReactNode;
    accent: 'slate' | 'emerald' | 'blue' | 'amber';
}) {
    const palette: Record<string, string> = {
        slate: 'bg-slate-50 text-slate-700 border-slate-100',
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        blue: 'bg-blue-50 text-blue-700 border-blue-100',
        amber: 'bg-amber-50 text-amber-700 border-amber-100',
    };
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-3 border ${palette[accent]}`}>{icon}</div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
        </div>
    );
}
