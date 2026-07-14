import { type LucideIcon, TrendingUp } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: 'blue' | 'emerald' | 'amber' | 'slate';
}

const colorConfig = {
  blue: {
    bg: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    icon: 'text-blue-600',
    value: 'text-blue-700',
  },
  emerald: {
    bg: 'bg-emerald-50',
    iconBg: 'bg-emerald-100',
    icon: 'text-emerald-600',
    value: 'text-emerald-700',
  },
  amber: {
    bg: 'bg-amber-50',
    iconBg: 'bg-amber-100',
    icon: 'text-amber-600',
    value: 'text-amber-700',
  },
  slate: {
    bg: 'bg-slate-50',
    iconBg: 'bg-slate-100',
    icon: 'text-slate-600',
    value: 'text-slate-700',
  },
};

export default function StatCard({ title, value, icon: Icon, trend, trendUp, color = 'blue' }: StatCardProps) {
  const c = colorConfig[color];
  return (
    <div className={`rounded-xl p-5 ${c.bg} border border-white shadow-sm`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${c.iconBg} flex items-center justify-center`}>
          <Icon size={20} className={c.icon} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trendUp ? 'text-emerald-600' : 'text-slate-500'}`}>
            <TrendingUp size={12} className={trendUp ? 'text-emerald-500' : 'text-slate-400'} />
            {trend}
          </div>
        )}
      </div>
      <p className={`text-2xl font-bold ${c.value} mb-1`}>{value}</p>
      <p className="text-sm text-slate-600 font-medium">{title}</p>
    </div>
  );
}
