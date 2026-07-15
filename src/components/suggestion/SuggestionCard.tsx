import { Clock, Star, ChevronRight, CircleCheck as CheckCircle2, PenLine } from 'lucide-react';
import { BlogSuggestion, SuggestionStatus } from '../../types';
import { SuggestionStatusBadge, DifficultyBadge } from '../common/StatusBadge';

interface SuggestionCardProps {
  suggestion: BlogSuggestion;
  prTitle?: string;
  onClick?: () => void;
  onStatusChange?: (id: string, status: SuggestionStatus) => void;
  compact?: boolean;
}

export default function SuggestionCard({ suggestion, prTitle, onClick, onStatusChange, compact = false }: SuggestionCardProps) {
  const scoreColor = suggestion.score >= 90 ? 'text-emerald-600' : suggestion.score >= 80 ? 'text-blue-600' : 'text-amber-600';
  const scoreBg = suggestion.score >= 90 ? 'bg-emerald-50' : suggestion.score >= 80 ? 'bg-blue-50' : 'bg-amber-50';

  return (
    <div
      className="bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={onClick}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <SuggestionStatusBadge status={suggestion.status} />
            <DifficultyBadge difficulty={suggestion.difficulty} />
          </div>
          <div className={`flex-shrink-0 flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${scoreBg} ${scoreColor}`}>
            <Star size={11} />
            {suggestion.score}
          </div>
        </div>

        <h3 className="text-sm font-bold text-slate-900 leading-snug mb-2 group-hover:text-blue-700 transition-colors">
          {suggestion.title}
        </h3>

        {!compact && (
          <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2">
            {suggestion.summary}
          </p>
        )}

        {!compact && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {suggestion.tags.slice(0, 4).map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock size={11} />
              約{suggestion.estimatedReadTime}分
            </span>
            {prTitle && (
              <span className="text-slate-300 hidden sm:inline">|</span>
            )}
            {prTitle && (
              <span className="text-slate-400 truncate max-w-[120px] hidden sm:inline" title={prTitle}>
                {prTitle}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            {suggestion.status !== 'published' && (
              <button
                onClick={() => onStatusChange?.(suggestion.id, 'in_progress')}
                className={`p-1.5 rounded-lg transition-colors ${suggestion.status === 'in_progress' ? 'text-amber-600 bg-amber-50' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'}`}
                title="執筆中にする"
              >
                <PenLine size={13} />
              </button>
            )}
            <button
              onClick={() => onStatusChange?.(suggestion.id, 'published')}
              className={`p-1.5 rounded-lg transition-colors ${suggestion.status === 'published' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
              title="公開済みにする"
            >
              <CheckCircle2 size={13} />
            </button>
            <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-400 transition-colors ml-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
