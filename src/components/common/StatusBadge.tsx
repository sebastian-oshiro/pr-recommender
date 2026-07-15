import { SuggestionStatus, Difficulty, PRStatus } from '../../types';

interface SuggestionStatusBadgeProps {
  status: SuggestionStatus;
  size?: 'sm' | 'md';
}

const suggestionStatusConfig: Record<SuggestionStatus, { label: string; className: string }> = {
  not_started: { label: '未着手', className: 'bg-slate-100 text-slate-600 border border-slate-200' },
  in_progress: { label: '執筆中', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  published: { label: '公開済み', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
};

export function SuggestionStatusBadge({ status, size = 'md' }: SuggestionStatusBadgeProps) {
  const { label, className } = suggestionStatusConfig[status];
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status === 'not_started' ? 'bg-slate-400' : status === 'in_progress' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
      {label}
    </span>
  );
}

interface DifficultyBadgeProps {
  difficulty: Difficulty;
}

const difficultyConfig: Record<Difficulty, { label: string; className: string }> = {
  beginner: { label: '初級', className: 'bg-sky-50 text-sky-700 border border-sky-200' },
  intermediate: { label: '中級', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  advanced: { label: '上級', className: 'bg-orange-50 text-orange-700 border border-orange-200' },
};

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const { label, className } = difficultyConfig[difficulty];
  return (
    <span className={`inline-flex items-center text-xs font-medium rounded-full px-2.5 py-1 ${className}`}>
      {label}
    </span>
  );
}

interface PRStatusBadgeProps {
  status: PRStatus;
}

const prStatusConfig: Record<PRStatus, { label: string; className: string; dotColor: string }> = {
  open: { label: 'オープン', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dotColor: 'bg-emerald-500' },
  merged: { label: 'マージ済み', className: 'bg-violet-50 text-violet-700 border border-violet-200', dotColor: 'bg-violet-500' },
  closed: { label: 'クローズ', className: 'bg-slate-100 text-slate-600 border border-slate-200', dotColor: 'bg-slate-400' },
};

export function PRStatusBadge({ status }: PRStatusBadgeProps) {
  const { label, className, dotColor } = prStatusConfig[status];
  return (
    <span className={`inline-flex items-center text-xs font-medium rounded-full px-2.5 py-1 ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColor}`} />
      {label}
    </span>
  );
}
