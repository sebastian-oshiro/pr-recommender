import { X, Clock, Star, CircleCheck as CheckCircle2, PenLine, ExternalLink, BookOpen } from 'lucide-react';
import { BlogSuggestion, GitHubPR, SuggestionStatus } from '../../types';
import { SuggestionStatusBadge, DifficultyBadge } from '../common/StatusBadge';

interface SuggestionDetailProps {
  suggestion: BlogSuggestion;
  pr?: GitHubPR;
  onClose: () => void;
  onStatusChange: (id: string, status: SuggestionStatus) => void;
}

export default function SuggestionDetail({ suggestion, pr, onClose, onStatusChange }: SuggestionDetailProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-blue-600" />
            <span className="font-bold text-slate-900 text-sm">ブログ提案の詳細</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 flex-1">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <SuggestionStatusBadge status={suggestion.status} />
            <DifficultyBadge difficulty={suggestion.difficulty} />
            <div className="flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
              <Star size={11} />
              スコア {suggestion.score}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Clock size={11} />
              約{suggestion.estimatedReadTime}分
            </div>
          </div>

          <h2 className="text-xl font-bold text-slate-900 leading-snug mb-3">{suggestion.title}</h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">{suggestion.summary}</p>

          <div className="mb-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">記事のポイント</h3>
            <ul className="space-y-2.5">
              {suggestion.keyPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-700 text-xs font-bold">{i + 1}</span>
                  </div>
                  <span className="text-sm text-slate-700 leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">タグ</h3>
            <div className="flex flex-wrap gap-2">
              {suggestion.tags.map(tag => (
                <span key={tag} className="text-xs px-3 py-1 bg-slate-100 text-slate-700 rounded-full font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {pr && (
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">元のPR</h3>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 mb-1 truncate">
                    #{pr.number} {pr.title}
                  </p>
                  <p className="text-xs text-slate-500">{pr.repository}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    <span className="text-emerald-600">+{pr.additions}</span>
                    <span className="text-red-500">-{pr.deletions}</span>
                    <span>{pr.filesChanged}ファイル変更</span>
                  </div>
                </div>
                <a
                  href={pr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 p-2 rounded-lg hover:bg-slate-200 transition-colors text-slate-500"
                  onClick={e => e.stopPropagation()}
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          )}

          {suggestion.draftMarkdown && (
            <div className="mb-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">記事下書き</h3>
              <div className="bg-slate-950 text-slate-100 rounded-xl p-4 max-h-80 overflow-y-auto">
                <pre className="text-xs leading-relaxed whitespace-pre-wrap font-mono">
                  {suggestion.draftMarkdown}
                </pre>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={() => onStatusChange(suggestion.id, 'in_progress')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                suggestion.status === 'in_progress'
                  ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                  : 'bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-amber-700'
              }`}
            >
              <PenLine size={15} />
              執筆中
            </button>
            <button
              onClick={() => onStatusChange(suggestion.id, 'published')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                suggestion.status === 'published'
                  ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                  : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              <CheckCircle2 size={15} />
              公開済み
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
