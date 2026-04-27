import { useEffect, useMemo, useState } from 'react';
import { Users, Layers, Link2, AlertTriangle } from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import MainLayout from '@/components/layout/MainLayout';
import StatTile from './components/StatTile';
import ChartCard from './components/ChartCard';
import authClient from '@/api/authClient';
import groupService from '@/api/group.service';
import githubService from '@/api/github.service';
import { parseJiraKey } from './dashboardUtils';

type AnyUser = { roles?: any; status?: string };

function normalizeRoleName(r: any): string {
  if (!r) return 'UNKNOWN';
  if (typeof r === 'string') return r;
  if (typeof r === 'object' && typeof r.name === 'string') return r.name;
  if (typeof r === 'object' && r.name?.name) return String(r.name.name);
  return 'UNKNOWN';
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<AnyUser[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [mappings, setMappings] = useState<any[]>([]);
  const [commitByGroup, setCommitByGroup] = useState<Array<{ name: string; commits: number }>>([]);
  const [unlinkedCommits, setUnlinkedCommits] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const [u, g, m] = await Promise.all([
          authClient.get('/api/auth/users').catch(() => []),
          groupService.getAllGroups().catch(() => []),
          githubService.getAllMappings().catch(() => []),
        ]);
        if (cancelled) return;
        setUsers(Array.isArray(u) ? u : []);
        setGroups(Array.isArray(g) ? g : []);
        setMappings(Array.isArray(m) ? m : []);

        const topGroups = (Array.isArray(g) ? g : []).slice(0, 6);
        const commits = await Promise.all(
          topGroups.map(async (gr: any) => {
            const list = await githubService.getCommitsByGroup(gr.groupId).catch(() => []);
            const arr = Array.isArray(list) ? list : [];
            return { name: gr.groupName ?? 'Group', commits: arr.length, raw: arr };
          }),
        );
        if (cancelled) return;
        setCommitByGroup(commits.map((c) => ({ name: c.name, commits: c.commits })));
        const all = commits.flatMap((c) => c.raw);
        const unlinked = all.filter((c: any) => !parseJiraKey(c?.message)).length;
        setUnlinkedCommits(unlinked);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const rolePie = useMemo(() => {
    const counts = new Map<string, number>();
    for (const u of users) {
      const roles = Array.isArray((u as any)?.roles) ? (u as any).roles : [];
      const primary = normalizeRoleName(roles[0]);
      counts.set(primary, (counts.get(primary) ?? 0) + 1);
    }
    return [...counts.entries()].map(([name, value]) => ({ name, value }));
  }, [users]);

  const integrationHealth = useMemo(() => {
    const byGroup = new Map<string, any>();
    for (const m of mappings) {
      if (!m?.groupId) continue;
      byGroup.set(String(m.groupId), m);
    }
    const connected = groups.filter((g) => byGroup.has(String(g.groupId))).length;
    const missing = Math.max(groups.length - connected, 0);
    return { connected, missing };
  }, [groups, mappings]);

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
        <p className="mt-1 text-slate-600">System overview, integrations, and signals to act on.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Total users"
          value={loading ? '—' : users.length}
          icon={<Users size={20} />}
          tone="blue"
          hint="From auth-service"
        />
        <StatTile
          label="Total workspaces"
          value={loading ? '—' : groups.length}
          icon={<Layers size={20} />}
          tone="emerald"
          hint="From group-service"
        />
        <StatTile
          label="Integrations connected"
          value={loading ? '—' : integrationHealth.connected}
          icon={<Link2 size={20} />}
          tone="amber"
          hint="Groups with mapping"
        />
        <StatTile
          label="Commits without Jira key"
          value={loading ? '—' : unlinkedCommits}
          icon={<AlertTriangle size={20} />}
          tone={unlinkedCommits > 0 ? 'red' : 'slate'}
          hint="Signal for process quality"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          title="Users by role"
          subtitle="Distribution by primary role"
          right={<span className="text-xs text-slate-500">{rolePie.reduce((a, b) => a + b.value, 0)} users</span>}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={rolePie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {rolePie.map((_, idx) => (
                    <Cell
                      key={idx}
                      fill={['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#64748b'][idx % 5]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Commits by workspace (top 6)" subtitle="Quick signal for activity (GitHub)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={commitByGroup}>
                <XAxis dataKey="name" hide />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="commits" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Integration monitor</div>
            <div className="mt-1 text-xs text-slate-500">Mapping group ↔ Jira project ↔ GitHub repo (from github-service)</div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
              <tr className="border-b border-slate-100">
                <th className="py-3 pr-4">Workspace</th>
                <th className="py-3 pr-4">Jira</th>
                <th className="py-3 pr-4">GitHub</th>
                <th className="py-3 pr-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {groups.slice(0, 12).map((g) => {
                const mapping = mappings.find((m) => String(m.groupId) === String(g.groupId));
                const ok = Boolean(mapping?.jiraProjectKey) && Boolean(mapping?.githubRepo);
                return (
                  <tr key={g.groupId} className="hover:bg-slate-50">
                    <td className="py-3 pr-4 font-medium text-slate-900">{g.groupName}</td>
                    <td className="py-3 pr-4 text-slate-600">{mapping?.jiraProjectKey || '—'}</td>
                    <td className="py-3 pr-4 text-slate-600">{mapping?.githubRepo || '—'}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          ok ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ok ? 'Connected' : 'Needs setup'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {groups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    Chưa có workspace.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
}

