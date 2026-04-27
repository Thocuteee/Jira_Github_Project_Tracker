import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Columns3, Users } from 'lucide-react';
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
import { useGroupContext } from '@/contexts/GroupContext';
import taskService, { type Task } from '@/api/task.service';
import groupService from '@/api/group.service';
import authService from '@/api/auth.service';
import githubService from '@/api/github.service';
import { parseJiraKey } from './dashboardUtils';

type Member = { userId: string; roleInGroup?: string };
type Commit = { userId?: string; message?: string };

function isOverdue(task: Task) {
  if (!task?.dueDate) return false;
  if (task.status === 'DONE') return false;
  const due = new Date(task.dueDate);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime();
}

export default function LeaderDashboard() {
  const { selectedGroup } = useGroupContext();
  const groupId = selectedGroup?.groupId;
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});
  const [commits, setCommits] = useState<Commit[]>([]);

  useEffect(() => {
    if (!groupId) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const [t, m, c] = await Promise.all([
          taskService.getTasksByGroup(groupId, 'LEADER').catch(() => [] as Task[]),
          groupService.getMembers(groupId).catch(() => [] as Member[]),
          githubService.getCommitsByGroup(groupId).catch(() => [] as Commit[]),
        ]);
        if (cancelled) return;
        setTasks(Array.isArray(t) ? t : []);
        setMembers(Array.isArray(m) ? m : []);
        setCommits(Array.isArray(c) ? c : []);

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
  }, [groupId]);

  const taskCounts = useMemo(() => {
    const todo = tasks.filter((t) => t.status === 'TODO').length;
    const prog = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const done = tasks.filter((t) => t.status === 'DONE').length;
    const overdue = tasks.filter(isOverdue).length;
    return { todo, prog, done, overdue };
  }, [tasks]);

  const workload = useMemo(() => {
    const counts = new Map<string, { tasks: number; commits: number }>();
    for (const m of members) counts.set(String(m.userId), { tasks: 0, commits: 0 });
    for (const t of tasks) {
      const u = (t as any).assignedTo;
      if (!u) continue;
      const cur = counts.get(String(u)) ?? { tasks: 0, commits: 0 };
      cur.tasks += 1;
      counts.set(String(u), cur);
    }
    for (const c of commits) {
      if (!c?.userId) continue;
      const cur = counts.get(String(c.userId)) ?? { tasks: 0, commits: 0 };
      cur.commits += 1;
      counts.set(String(c.userId), cur);
    }
    return [...counts.entries()].map(([userId, v]) => ({
      name: nameMap[userId] || userId.slice(0, 8),
      tasks: v.tasks,
      commits: v.commits,
    }));
  }, [commits, members, nameMap, tasks]);

  const tasksWithoutCode = useMemo(() => {
    const linkedKeys = new Set(commits.map((c) => parseJiraKey(c.message)).filter(Boolean) as string[]);
    return tasks.filter((t) => t.jiraIssueKey).filter((t) => !linkedKeys.has(String(t.jiraIssueKey)));
  }, [commits, tasks]);

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Leader Dashboard</h1>
        <p className="mt-1 text-slate-600">
          Sprint snapshot, workload balance, and Task ↔ Code quality for <span className="font-semibold">{selectedGroup?.groupName || '—'}</span>.
        </p>
      </div>

      {!groupId ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Hãy chọn workspace (group) ở sidebar để xem dashboard nhóm.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile label="To do" value={loading ? '—' : taskCounts.todo} icon={<Columns3 size={20} />} tone="slate" />
            <StatTile label="In progress" value={loading ? '—' : taskCounts.prog} icon={<Columns3 size={20} />} tone="amber" />
            <StatTile label="Done" value={loading ? '—' : taskCounts.done} icon={<CheckCircle2 size={20} />} tone="emerald" />
            <StatTile
              label="Overdue / Unlinked"
              value={loading ? '—' : `${taskCounts.overdue} / ${tasksWithoutCode.length}`}
              icon={<AlertTriangle size={20} />}
              tone={taskCounts.overdue > 0 || tasksWithoutCode.length > 0 ? 'red' : 'slate'}
              hint="overdue / task with Jira key but no commit"
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ChartCard title="Workload by member" subtitle="Tasks assigned vs commits (quick balance signal)">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workload}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="tasks" fill="#2563eb" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="commits" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Unlinked work" subtitle="Actions you can take today">
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-slate-900">Tasks without commit</div>
                    <div className="text-sm font-bold text-slate-900">{tasksWithoutCode.length}</div>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Gợi ý: yêu cầu team thêm Jira key vào commit message để trace tự động.
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-slate-900">Commits without Jira key</div>
                    <div className="text-sm font-bold text-slate-900">
                      {commits.filter((c) => !parseJiraKey(c.message)).length}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Rule: commit message nên có dạng <span className="font-mono">ABC-123</span>.
                  </div>
                </div>
              </div>
            </ChartCard>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <ChartCard title="Task board (snapshot)" subtitle="Todo / In progress / Done (click to drill-down)">
              <div className="grid grid-cols-3 gap-3 text-xs">
                {(['TODO', 'IN_PROGRESS', 'DONE'] as const).map((st) => (
                  <div key={st} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-2 font-semibold text-slate-700">{st.replace('_', ' ')}</div>
                    <div className="space-y-2">
                      {tasks.filter((t) => t.status === st).slice(0, 5).map((t) => (
                        <div key={t.taskId} className="rounded-lg border border-slate-200 bg-white p-2">
                          <div className="font-medium text-slate-900 line-clamp-2">{t.title}</div>
                          <div className="mt-1 text-[11px] text-slate-500">Jira: {t.jiraIssueKey || '—'}</div>
                        </div>
                      ))}
                      {tasks.filter((t) => t.status === st).length === 0 ? (
                        <div className="text-[11px] text-slate-400">—</div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>

            <ChartCard title="Members" subtitle="Roles in group">
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.userId} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">
                        {nameMap[m.userId] || m.userId.slice(0, 8)}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">Role: {m.roleInGroup || 'MEMBER'}</div>
                    </div>
                    <Users size={18} className="text-slate-400" />
                  </div>
                ))}
                {members.length === 0 ? <div className="text-sm text-slate-500">—</div> : null}
              </div>
            </ChartCard>

            <ChartCard title="Recent commits" subtitle="Quick trace to activity">
              <div className="space-y-2">
                {commits.slice(0, 8).map((c: any) => (
                  <div key={c.commitId || c.commitHash} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="text-sm font-semibold text-slate-900 line-clamp-2">{c.message || '(no message)'}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      Jira: <span className="font-medium text-slate-700">{parseJiraKey(c.message) || '—'}</span>
                    </div>
                  </div>
                ))}
                {commits.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                    Chưa có commit.
                  </div>
                ) : null}
              </div>
            </ChartCard>
          </div>
        </>
      )}
    </MainLayout>
  );
}

