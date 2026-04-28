import { useEffect, useMemo, useState } from 'react';
import {
    AlertCircle,
    ListChecks,
    RefreshCw,
    Filter,
    ExternalLink,
} from 'lucide-react';
import jiraService, { type JiraConfig, type JiraIssue } from '@/api/jira.service';

interface JiraIssueListReportProps {
    groupId: string;
}

const STATUS_FILTERS: { id: 'all' | 'todo' | 'in-progress' | 'done'; label: string }[] = [
    { id: 'all', label: 'Tất cả' },
    { id: 'todo', label: 'Chưa làm' },
    { id: 'in-progress', label: 'Đang làm' },
    { id: 'done', label: 'Hoàn thành' },
];

function categorizeStatus(status?: string): 'todo' | 'in-progress' | 'done' | 'other' {
    if (!status) return 'other';
    const s = status.toLowerCase();
    if (s.includes('done') || s.includes('closed') || s.includes('resolved') || s.includes('hoàn thành')) return 'done';
    if (s.includes('progress') || s.includes('doing') || s.includes('review') || s.includes('đang')) return 'in-progress';
    if (s.includes('todo') || s.includes('open') || s.includes('backlog') || s.includes('to do') || s.includes('chưa')) return 'todo';
    return 'other';
}

function statusBadge(status?: string) {
    const cat = categorizeStatus(status);
    if (cat === 'done') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (cat === 'in-progress') return 'bg-blue-50 text-blue-700 border-blue-100';
    if (cat === 'todo') return 'bg-amber-50 text-amber-700 border-amber-100';
    return 'bg-slate-50 text-slate-600 border-slate-100';
}

function priorityBadge(priority?: string) {
    if (!priority) return 'bg-slate-50 text-slate-500 border-slate-100';
    const p = priority.toLowerCase();
    if (p.includes('high') || p.includes('cao') || p.includes('urgent')) return 'bg-red-50 text-red-700 border-red-100';
    if (p.includes('medium') || p.includes('trung')) return 'bg-amber-50 text-amber-700 border-amber-100';
    if (p.includes('low') || p.includes('thấp')) return 'bg-slate-50 text-slate-600 border-slate-100';
    return 'bg-slate-50 text-slate-600 border-slate-100';
}

export default function JiraIssueListReport({ groupId }: JiraIssueListReportProps) {
    const [configs, setConfigs] = useState<JiraConfig[]>([]);
    const [issues, setIssues] = useState<JiraIssue[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'todo' | 'in-progress' | 'done'>('all');
    const [search, setSearch] = useState('');

    const fetchData = async () => {
        if (!groupId) return;
        setLoading(true);
        setError(null);
        try {
            const cfgs = await jiraService.getConfigsByGroup(groupId);
            setConfigs(cfgs);
            if (cfgs.length === 0) {
                setIssues([]);
            } else {
                const data = await jiraService.getIssuesByGroup(groupId);
                setIssues(data);
            }
        } catch (err) {
            console.error('Error fetching Jira issues:', err);
            setError('Không thể tải danh sách Jira issue cho nhóm này.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [groupId]);

    const handleSync = async () => {
        if (configs.length === 0) {
            setError('Nhóm chưa có cấu hình Jira. Vui lòng cấu hình mapping Jira/GitHub trước.');
            return;
        }
        setSyncing(true);
        setError(null);
        try {
            await jiraService.syncIssuesByGroup(groupId);
            const data = await jiraService.getIssuesByGroup(groupId);
            setIssues(data);
        } catch (err) {
            console.error('Error syncing Jira:', err);
            setError('Đồng bộ Jira thất bại. Kiểm tra lại token Jira hoặc kết nối.');
        } finally {
            setSyncing(false);
        }
    };

    const filteredIssues = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        return issues.filter((it) => {
            if (filter !== 'all' && categorizeStatus(it.status) !== filter) return false;
            if (!keyword) return true;
            const haystack = [it.jiraIssueKey, it.summary, it.assigneeEmail, it.issueType]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(keyword);
        });
    }, [issues, filter, search]);

    const summary = useMemo(() => {
        const totals = {
            total: issues.length,
            todo: 0,
            inProgress: 0,
            done: 0,
            other: 0,
        };
        for (const it of issues) {
            const cat = categorizeStatus(it.status);
            if (cat === 'done') totals.done += 1;
            else if (cat === 'in-progress') totals.inProgress += 1;
            else if (cat === 'todo') totals.todo += 1;
            else totals.other += 1;
        }
        return totals;
    }, [issues]);

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <ListChecks size={20} className="text-blue-600" />
                        Danh sách Jira issue của nhóm
                    </h3>
                    <p className="text-xs font-medium text-slate-500 mt-1">
                        {configs.length > 0
                            ? `Đang theo dõi ${configs.length} dự án Jira: ${configs.map(c => c.projectKey).join(', ')}`
                            : 'Chưa có cấu hình Jira cho nhóm này.'}
                    </p>
                </div>
                <button
                    onClick={handleSync}
                    disabled={syncing || configs.length === 0}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 transition-all shadow-md shadow-blue-100 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
                    {syncing ? 'Đang đồng bộ...' : 'Đồng bộ Jira ngay'}
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-3 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard label="Tổng issue" value={summary.total} accent="slate" />
                <SummaryCard label="Chưa làm" value={summary.todo} accent="amber" />
                <SummaryCard label="Đang làm" value={summary.inProgress} accent="blue" />
                <SummaryCard label="Hoàn thành" value={summary.done} accent="emerald" />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-slate-100 px-5 py-3 bg-slate-50/40">
                    <div className="flex flex-wrap items-center gap-2">
                        <Filter size={14} className="text-slate-400" />
                        {STATUS_FILTERS.map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => setFilter(opt.id)}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all border ${
                                    filter === opt.id
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm theo key, summary, assignee..."
                        className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full md:w-72"
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-slate-400 font-bold uppercase tracking-widest text-[10px] bg-slate-50/40">
                            <tr>
                                <th className="px-5 py-3">Issue Key</th>
                                <th className="px-5 py-3">Summary</th>
                                <th className="px-5 py-3">Type</th>
                                <th className="px-5 py-3">Status</th>
                                <th className="px-5 py-3">Priority</th>
                                <th className="px-5 py-3">Assignee</th>
                                <th className="px-5 py-3">Synced</th>
                                <th className="px-5 py-3 text-right">Link</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredIssues.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                                        {issues.length === 0
                                            ? 'Chưa có Jira issue nào. Hãy thử bấm Đồng bộ Jira.'
                                            : 'Không có issue nào khớp với bộ lọc.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredIssues.map((it) => {
                                    const cfg = configs.find(c => c.jiraId === it.jiraId);
                                    const issueUrl = cfg?.jiraUrl ? `${cfg.jiraUrl.replace(/\/$/, '')}/browse/${it.jiraIssueKey}` : null;
                                    return (
                                        <tr key={it.jiraIssueId} className="group hover:bg-slate-50/80 transition-colors">
                                            <td className="px-5 py-3 font-mono text-xs font-bold text-blue-700">{it.jiraIssueKey}</td>
                                            <td className="px-5 py-3 text-slate-700 max-w-[420px] truncate">{it.summary || <span className="italic text-slate-300">không có</span>}</td>
                                            <td className="px-5 py-3 text-slate-500 text-xs">{it.issueType || '-'}</td>
                                            <td className="px-5 py-3">
                                                <span className={`px-2 py-0.5 rounded text-[11px] border font-bold uppercase tracking-wider ${statusBadge(it.status)}`}>
                                                    {it.status || 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`px-2 py-0.5 rounded text-[11px] border font-bold uppercase tracking-wider ${priorityBadge(it.priority)}`}>
                                                    {it.priority || '-'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-slate-600 text-xs">{it.assigneeEmail || <span className="italic text-slate-300">chưa gán</span>}</td>
                                            <td className="px-5 py-3 text-slate-500 text-xs">
                                                {it.syncedAt ? new Date(it.syncedAt).toLocaleString('vi-VN') : '-'}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                {issueUrl ? (
                                                    <a
                                                        href={issueUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
                                                    >
                                                        Mở Jira <ExternalLink size={12} />
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-300 text-xs">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function SummaryCard({ label, value, accent }: { label: string; value: number; accent: 'slate' | 'emerald' | 'blue' | 'amber' }) {
    const palette = {
        slate: 'text-slate-700 bg-slate-50 border-slate-100',
        emerald: 'text-emerald-700 bg-emerald-50 border-emerald-100',
        blue: 'text-blue-700 bg-blue-50 border-blue-100',
        amber: 'text-amber-700 bg-amber-50 border-amber-100',
    };
    return (
        <div className={`rounded-xl border p-4 ${palette[accent]}`}>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{label}</p>
            <p className="text-2xl font-black mt-1">{value}</p>
        </div>
    );
}
