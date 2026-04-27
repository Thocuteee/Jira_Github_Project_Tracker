import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, GitBranch, ListTodo } from 'lucide-react';
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
import taskService, { type Task } from '@/api/task.service';
import githubService from '@/api/github.service';
import { parseJiraKey, groupCommitsByWeek } from './dashboardUtils';

type Commit = { commitId?: string; message?: string; committedAt?: string };

function isOverdue(task: Task) {
  if (!task?.dueDate) return false;
  if (task.status === 'DONE') return false;
  const due = new Date(task.dueDate);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime();
}

export default function MemberDashboard() {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<{ total: number; open: number; done: number; overdue: number } | null>(null);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [myCommits, setMyCommits] = useState<Commit[]>([]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const userId = localStorage.getItem('userId') || '';
        const [s, t, c] = await Promise.all([
          taskService.getMyAssignedTasksSummary().catch(() => null),
          taskService.getMyAssignedTasks().catch(() => [] as Task[]),
          userId ? githubService.getCommitsByUser(userId).catch(() => []) : Promise.resolve([]),
        ]);
        if (cancelled) return;
        setSummary(s);
        setMyTasks(Array.isArray(t) ? t : []);
        setMyCommits(Array.isArray(c) ? c : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const overdueTasks = useMemo(() => myTasks.filter(isOverdue), [myTasks]);
  const commitsWithoutKey = useMemo(() => myCommits.filter((c) => !parseJiraKey(c?.message)).length, [myCommits]);
  const commitsWeekly = useMemo(() => groupCommitsByWeek(myCommits), [myCommits]);

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Dashboard</h1>
        <p className="mt-1 text-slate-600">Focus, deadlines, and your Task ↔ Code mapping.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Open tasks"
          value={loading ? '—' : summary?.open ?? 0}
          icon={<ListTodo size={20} />}
          tone="blue"
        />
        <StatTile
          label="Overdue"
          value={loading ? '—' : summary?.overdue ?? overdueTasks.length}
          icon={<AlertTriangle size={20} />}
          tone={(summary?.overdue ?? overdueTasks.length) > 0 ? 'red' : 'slate'}
          hint="Prioritize these first"
        />
        <StatTile
          label="Done"
          value={loading ? '—' : summary?.done ?? 0}
          icon={<CheckCircle2 size={20} />}
          tone="emerald"
        />
        <StatTile
          label="Commits w/o Jira key"
          value={loading ? '—' : commitsWithoutKey}
          icon={<GitBranch size={20} />}
          tone={commitsWithoutKey > 0 ? 'amber' : 'slate'}
          hint="Add ABC-123 in commit message"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="My commits by week" subtitle="Trend of code activity">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={commitsWeekly}>
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Upcoming deadlines" subtitle="Overdue tasks are highlighted">
          <div className="space-y-3">
            {myTasks
              .slice()
              .sort((a, b) => String(a.dueDate ?? '').localeCompare(String(b.dueDate ?? '')))
              .slice(0, 6)
              .map((t) => {
                const overdue = isOverdue(t);
                return (
                  <div
                    key={t.taskId}
                    className={`rounded-xl border p-4 ${
                      overdue ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 line-clamp-2">{t.title}</div>
                        <div className="mt-1 text-xs text-slate-600">Status: {t.status}</div>
                      </div>
                      <div className="shrink-0 text-xs font-semibold text-slate-700">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
                          <Clock size={14} /> {t.dueDate || '—'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Jira: <span className="font-medium text-slate-700">{t.jiraTaskKey || '—'}</span>
                    </div>
                  </div>
                );
              })}
            {myTasks.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                Chưa có task được giao.
              </div>
            ) : null}
          </div>
        </ChartCard>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Tasks without code (quick check)" subtitle="Task có Jira key nhưng chưa thấy commit match key">
          <div className="space-y-3">
            {myTasks
              .filter((t) => t.jiraTaskKey)
              .filter((t) => !myCommits.some((c) => parseJiraKey(c.message) === t.jiraTaskKey))
              .slice(0, 8)
              .map((t) => (
                <div key={t.taskId} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="font-semibold text-slate-900 line-clamp-2">{t.title}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    Jira: <span className="font-medium text-slate-700">{t.jiraTaskKey}</span> · Status: {t.status}
                  </div>
                </div>
              ))}
            {myTasks.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">—</div>
            ) : null}
          </div>
        </ChartCard>

        <ChartCard title="Commits without Jira key" subtitle="Các commit này khó trace về task">
          <div className="space-y-3">
            {myCommits
              .filter((c) => !parseJiraKey(c.message))
              .slice(0, 8)
              .map((c) => (
                <div key={c.commitId} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="text-sm font-semibold text-slate-900 line-clamp-2">{c.message || '(no message)'}</div>
                  <div className="mt-1 text-xs text-slate-500">Committed at: {c.committedAt || '—'}</div>
                </div>
              ))}
            {myCommits.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Chưa có commit.</div>
            ) : null}
          </div>
        </ChartCard>
      </div>
    </MainLayout>
  );
}

