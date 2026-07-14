import { useState } from 'react';
import { Search, Filter, Import as SortAsc } from 'lucide-react';
import SuggestionCard from '../components/suggestion/SuggestionCard';
import { BlogSuggestion, GitHubPR, SuggestionStatus, Difficulty } from '../types';

interface SuggestionsProps {
  suggestions: BlogSuggestion[];
  prs: GitHubPR[];
  onSuggestionClick: (id: string) => void;
  onStatusChange: (id: string, status: SuggestionStatus) => void;
}

type FilterStatus = 'all' | SuggestionStatus;
type SortOption = 'score' | 'date' | 'readTime';

const statusFilters: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'not_started', label: '未着手' },
  { value: 'in_progress', label: '執筆中' },
  { value: 'published', label: '公開済み' },
];

const difficultyFilters: { value: 'all' | Difficulty; label: string }[] = [
  { value: 'all', label: 'すべての難易度' },
  { value: 'beginner', label: '初級' },
  { value: 'intermediate', label: '中級' },
  { value: 'advanced', label: '上級' },
];

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'score', label: 'スコア順' },
  { value: 'date', label: '新着順' },
  { value: 'readTime', label: '読了時間順' },
];

export default function Suggestions({ suggestions, prs, onSuggestionClick, onStatusChange }: SuggestionsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | Difficulty>('all');
  const [sortBy, setSortBy] = useState<SortOption>('score');

  const filtered = suggestions
    .filter(s => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (difficultyFilter !== 'all' && s.difficulty !== difficultyFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return s.title.toLowerCase().includes(q) || s.tags.some(t => t.toLowerCase().includes(q)) || s.summary.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'date') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return a.estimatedReadTime - b.estimatedReadTime;
    });

  const statusCounts: Record<FilterStatus, number> = {
    all: suggestions.length,
    not_started: suggestions.filter(s => s.status === 'not_started').length,
    in_progress: suggestions.filter(s => s.status === 'in_progress').length,
    published: suggestions.filter(s => s.status === 'published').length,
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="タイトルやタグで検索..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-400 flex-shrink-0" />
          <select
            value={difficultyFilter}
            onChange={e => setDifficultyFilter(e.target.value as 'all' | Difficulty)}
            className="text-sm bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700"
          >
            {difficultyFilters.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <SortAsc size={15} className="text-slate-400 flex-shrink-0" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            className="text-sm bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700"
          >
            {sortOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {statusFilters.map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === f.value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            {f.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusFilter === f.value ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
              {statusCounts[f.value]}
            </span>
          </button>
        ))}
      </div>

      <div>
        <p className="text-xs text-slate-500 mb-4">{filtered.length}件の提案</p>
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map(suggestion => {
              const pr = prs.find(p => p.id === suggestion.prId);
              return (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  prTitle={pr?.title}
                  onClick={() => onSuggestionClick(suggestion.id)}
                  onStatusChange={onStatusChange}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Search size={22} className="text-slate-400" />
            </div>
            <p className="text-slate-600 font-semibold mb-1">提案が見つかりません</p>
            <p className="text-sm text-slate-400">検索条件を変更してお試しください</p>
          </div>
        )}
      </div>
    </div>
  );
}
