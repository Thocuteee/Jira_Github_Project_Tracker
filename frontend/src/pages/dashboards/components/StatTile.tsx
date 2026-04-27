import type { ReactNode } from 'react';

export default function StatTile({
  label,
  value,
  icon,
  tone = 'slate',
  hint,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: 'slate' | 'blue' | 'emerald' | 'amber' | 'red';
  hint?: string;
}) {
  const toneClass =
    tone === 'blue'
      ? 'bg-blue-50 text-blue-700'
      : tone === 'emerald'
        ? 'bg-emerald-50 text-emerald-700'
        : tone === 'amber'
          ? 'bg-amber-50 text-amber-800'
          : tone === 'red'
            ? 'bg-red-50 text-red-700'
            : 'bg-slate-100 text-slate-700';

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        {icon ? (
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${toneClass}`}>{icon}</div>
        ) : null}
        <div className="min-w-0">
          <div className="text-2xl font-bold tabular-nums text-slate-900">{value}</div>
          <div className="text-sm text-slate-500">{label}</div>
          {hint ? <div className="mt-1 text-xs text-slate-400">{hint}</div> : null}
        </div>
      </div>
    </div>
  );
}

