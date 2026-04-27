import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, GitBranch, Users } from 'lucide-react';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import MainLayout from '@/components/layout/MainLayout';
import StatTile from './components/StatTile';
import ChartCard from './components/ChartCard';
import groupService from '@/api/group.service';
import taskService, { type Task } from '@/api/task.service';
import githubService from '@/api/github.service';
import authService from '@/api/auth.service';
import { parseJiraKey, groupCommitsByWeek } from './dashboardUtils';

type ManagedGroup = { groupId: string; groupName: string; status?: string };
type GroupStat = { groupId: string; memberCount: number; groupName?: string };
type Commit = { userId?: string; message?: string; committedAt?: string };

function isOverdue(task: Task) {
  if (!task?.dueDate) return false;
  if (task.status === 'DONE') return false;
  const due = new Date(task.dueDate);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime();
}

export default function LecturerDashboard() {
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<ManagedGroup[]>([]);
  const [stats, setStats] = useState<Record<string, GroupStat>>({});
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [members, setMembers] = useState<Array<{ userId: string }>>([]);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const [g, s] = await Promise.all([
          groupService.getManagedByMe().catch(() => []),
          groupService.getManagedByMeStats().catch(() => []),
        ]);
        if (cancelled) return;
        const gArr = Array.isArray(g) ? g : [];
        setGroups(gArr);
        if (!selectedGroupId && gArr[0]?.groupId) setSelectedGroupId(String(gArr[0].groupId));

        const sArr = Array.isArray(s) ? s : [];
        const map: Record<string, GroupStat> = {};
        for (const it of sArr) {
          if (!it?.groupId) continue;
          map[String(it.groupId)] = { groupId: String(it.groupId), memberCount: Number(it.memberCount ?? 0), groupName: it.groupName };
        }
        setStats(map);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [selectedGroupId]);

  useEffect(() => {
    if (!selectedGroupId) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const [t, c, m] = await Promise.all([
          taskService.getTasksByGroup(selectedGroupId, 'LECTURER').catch(() => [] as Task[]),
          githubService.getCommitsByGroup(selectedGroupId).catch(() => [] as Commit[]),
          groupService.getMembers(selectedGroupId).catch(() => [] as any[]),
        ]);
        if (cancelled) return;
        setTasks(Array.isArray(t) ? t : []);
        setCommits(Array.isArray(c) ? c : []);
        setMembers(Array.isArray(m) ? m : []);

        const ids = (Array.isArray(m) ? m : []).map((x: any) => String(x.userId)).filter(Boolean);
        if (ids.length) {
          const map = await authService.getUserNames(ids as any).catch(() => ({}));
          if (!cancelled) setNameMap(map || {});
        } else {
          setNameMap({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [selectedGroupId]);

  const overview = useMemo(() => {
    const totalTasks = tasks.length;
    const done = tasks.filter((t) => t.status === 'DONE').length;
    const overdue = tasks.filter(isOverdue).length;
    const commitsWeekly = groupCommitsByWeek(commits);
    const commitsWithoutKey = commits.filter((c) => !parseJiraKey(c.message)).length;
    const tasksWithoutCode = tasks.filter((t) => t.jiraTaskKey).filter((t) => !commits.some((c) => parseJiraKey(c.message) === t.jiraTaskKey)).length;
    const memberCount = selectedGroupId ? stats[selectedGroupId]?.memberCount ?? members.length : members.length;
    return { totalTasks, done, overdue, commitsWeekly, commitsWithoutKey, tasksWithoutCode, memberCount };
  }, [commits, members.length, selectedGroupId, stats, tasks]);

  const contribution = useMemo(() => {
    const row = new Map<string, { userId: string; tasks: number; commits: number }>();
    for (const m of members) row.set(String(m.userId), { userId: String(m.userId), tasks: 0, commits: 0 });
    for (const t of tasks) {
      const u = (t as any).assignedTo;
      if (!u) continue;
      const cur = row.get(String(u)) ?? { userId: String(u), tasks: 0, commits: 0 };
      cur.tasks += 1;
      row.set(String(u), cur);
    }
    for (const c of commits) {
      if (!c?.userId) continue;
      const cur = row.get(String(c.userId)) ?? { userId: String(c.userId), tasks: 0, commits: 0 };
      cur.commits += 1;
      row.set(String(c.userId), cur);
    }
    return [...row.values()].map((r) => ({
      name: nameMap[r.userId] || r.userId.slice(0, 8),
      tasks: r.tasks,
      commits: r.commits,
      score: r.tasks * 2 + r.commits,
    })).sort((a, b) => b.score - a.score);
  }, [commits, members, nameMap, tasks]);

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Lecturer Dashboard</h1>
        <p className="mt-1 text-slate-600">Track group progress, contribution, and risks (Task ↔ Code).</p>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-900">Managed groups</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Selected:</span>
            <select
              value={selectedGroupId || ''}
              onChange={(e) => setSelectedGroupId(e.target.value || null)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {groups.map((g) => (
                <option key={g.groupId} value={g.groupId}>
                  {g.groupName}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          {groups.slice(0, 6).map((g) => {
            const mcount = stats[String(g.groupId)]?.memberCount;
            return (
              <button
                key={g.groupId}
                type="button"
                onClick={() => setSelectedGroupId(String(g.groupId))}
                className={`rounded-xl border p-4 text-left transition ${
                  String(g.groupId) === String(selectedGroupId)
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="font-semibold text-slate-900 line-clamp-1">{g.groupName}</div>
                <div className="mt-1 text-xs text-slate-500">
                  Members: <span className="font-medium text-slate-700">{mcount ?? '—'}</span>
                </div>
              </button>
            );
          })}
          {groups.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
              Bạn chưa được gán nhóm nào (roleInGroup=LECTURER).
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Members" value={loading ? '—' : overview.memberCount} icon={<Users size={20} />} tone="blue" />
        <StatTile
          label="Tasks done / total"
          value={loading ? '—' : `${overview.done}/${overview.totalTasks}`}
          icon={<BarChart3 size={20} />}
          tone="emerald"
          hint="Progress snapshot"
        />
        <StatTile
          label="Overdue tasks"
          value={loading ? '—' : overview.overdue}
          icon={<AlertTriangle size={20} />}
          tone={overview.overdue > 0 ? 'red' : 'slate'}
        />
        <StatTile
          label="Unlinked signals"
          value={loading ? '—' : `${overview.tasksWithoutCode} / ${overview.commitsWithoutKey}`}
          icon={<GitBranch size={20} />}
          tone={(overview.tasksWithoutCode + overview.commitsWithoutKey) > 0 ? 'amber' : 'slate'}
          hint="tasks w/o code / commits w/o key"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Commits by week" subtitle="Code activity trend (GitHub)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overview.commitsWeekly}>
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Contribution analysis (baseline)" subtitle="Tasks assigned + commits → score (simple)">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                <tr className="border-b border-slate-100">
                  <th className="py-3 pr-4">Member</th>
                  <th className="py-3 pr-4">Tasks</th>
                  <th className="py-3 pr-4">Commits</th>
                  <th className="py-3 pr-4">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {contribution.slice(0, 10).map((r) => (
                  <tr key={r.name} className="hover:bg-slate-50">
                    <td className="py-3 pr-4 font-medium text-slate-900">{r.name}</td>
                    <td className="py-3 pr-4 text-slate-600">{r.tasks}</td>
                    <td className="py-3 pr-4 text-slate-600">{r.commits}</td>
                    <td className="py-3 pr-4 font-semibold text-slate-900">{r.score}</td>
                  </tr>
                ))}
                {contribution.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      —
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>
    </MainLayout>
  );
}

