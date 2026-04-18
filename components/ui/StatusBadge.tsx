"use client";

type Status = 'active' | 'expired' | 'pending' | 'paid' | 'failed' | 'open' | 'in_progress' | 'resolved';

const config: Record<Status, { label: string; classes: string }> = {
  active:      { label: 'Active',      classes: 'bg-emerald-900/30 text-emerald-200 border-emerald-700/60' },
  expired:     { label: 'Expired',     classes: 'bg-red-900/30 text-red-200 border-red-700/60' },
  pending:     { label: 'Pending',     classes: 'bg-amber-900/30 text-amber-200 border-amber-700/60' },
  paid:        { label: 'Paid',        classes: 'bg-emerald-900/30 text-emerald-200 border-emerald-700/60' },
  failed:      { label: 'Failed',      classes: 'bg-red-900/30 text-red-200 border-red-700/60' },
  open:        { label: 'Open',        classes: 'bg-blue-900/35 text-blue-200 border-blue-700/60' },
  in_progress: { label: 'In Progress', classes: 'bg-amber-900/35 text-amber-200 border-amber-700/60' },
  resolved:    { label: 'Resolved',    classes: 'bg-emerald-900/30 text-emerald-200 border-emerald-700/60' },
};

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const { label, classes } = config[status] ?? { label: status, classes: 'bg-slate-800 text-slate-200 border-slate-700' };
  return (
    <span className={`inline-flex items-center border font-medium rounded-full ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'} ${classes}`}>
      {label}
    </span>
  );
}
