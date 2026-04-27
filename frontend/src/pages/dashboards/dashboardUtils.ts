export type ChartPoint = { label: string; value: number };

export function parseJiraKey(text?: string | null): string | null {
  if (!text) return null;
  const m = text.match(/([A-Z]+-\d+)/);
  return m?.[1] ?? null;
}

export function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Monday=0
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function formatWeekLabel(d: Date) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}

export function groupCommitsByWeek(commits: Array<{ committedAt?: string }>) {
  const bucket = new Map<string, number>();
  for (const c of commits) {
    if (!c?.committedAt) continue;
    const dt = new Date(c.committedAt);
    if (Number.isNaN(dt.getTime())) continue;
    const wk = startOfWeek(dt);
    const key = wk.toISOString();
    bucket.set(key, (bucket.get(key) ?? 0) + 1);
  }
  return [...bucket.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([iso, count]) => ({ label: formatWeekLabel(new Date(iso)), value: count }));
}

