import { useState } from 'react';
import { Search, GitPullRequest, GitMerge, Bot, Sparkles, CircleAlert as AlertCircle, CircleCheck as CheckCircle2, Loader as Loader2 } from 'lucide-react';
import PRCard from '../components/pr/PRCard';
import { BlogSuggestion, GitHubPR } from '../types';
import { analyzePRWithAI } from '../services/analyzeService';
import { saveSuggestionToDB } from '../services/prService';

interface PRAnalysisProps {
  prs: GitHubPR[];
  suggestions: BlogSuggestion[];
  onSuggestionCreated: (suggestion: BlogSuggestion) => void;
}

type PRFilter = 'all' | 'merged' | 'open' | 'closed';

const prFilters: { value: PRFilter; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'merged', label: 'マージ済み' },
  { value: 'open', label: 'オープン' },
  { value: 'closed', label: 'クローズ' },
];

export default function PRAnalysis({ prs, suggestions, onSuggestionCreated }: PRAnalysisProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<PRFilter>('all');
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analyzeResults, setAnalyzeResults] = useState<Record<string, 'success' | 'error'>>({});
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});

  const getSuggestionCount = (prId: string) =>
    suggestions.filter(s => s.prId === prId).length;

  const filtered = prs.filter(pr => {
    if (filter !== 'all' && pr.status !== filter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        pr.title.toLowerCase().includes(q) ||
        pr.repository.toLowerCase().includes(q) ||
        pr.techStack.some(t => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const filterCounts: Record<PRFilter, number> = {
    all: prs.length,
    merged: prs.filter(p => p.status === 'merged').length,
    open: prs.filter(p => p.status === 'open').length,
    closed: prs.filter(p => p.status === 'closed').length,
  };

  const totalAdditions = prs.reduce((sum, pr) => sum + pr.additions, 0);
  const totalDeletions = prs.reduce((sum, pr) => sum + pr.deletions, 0);

  const handleAnalyze = async (pr: GitHubPR) => {
    setAnalyzingId(pr.id);
    setAnalyzeResults(prev => { const next = { ...prev }; delete next[pr.id]; return next; });
    setErrorMessages(prev => { const next = { ...prev }; delete next[pr.id]; return next; });

    try {
      const partial = await analyzePRWithAI(pr);
      const saved = await saveSuggestionToDB({ ...partial, status: 'not_started' });
      if (saved) {
        onSuggestionCreated(saved);
        setAnalyzeResults(prev => ({ ...prev, [pr.id]: 'success' }));
      } else {
        throw new Error('保存に失敗しました');
      }
    } catch (err) {
      setAnalyzeResults(prev => ({ ...prev, [pr.id]: 'error' }));
      setErrorMessages(prev => ({ ...prev, [pr.id]: err instanceof Error ? err.message : 'AI分析に失敗しました' }));
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{prs.length}</p>
          <p className="text-xs text-slate-500 mt-1">解析済みPR</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">+{totalAdditions.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">総追加行数</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-red-500">-{totalDeletions.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">総削除行数</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="タイトル・リポジトリ・技術で検索..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {prFilters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              filter === f.value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            {f.value === 'merged' && <GitMerge size={12} />}
            {f.value === 'open' && <GitPullRequest size={12} />}
            {f.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === f.value ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
              {filterCounts[f.value]}
            </span>
          </button>
        ))}
      </div>

      <div>
        <p className="text-xs text-slate-500 mb-4">{filtered.length}件のPR</p>
        {filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map(pr => (
              <div key={pr.id} className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <PRCard
                      pr={pr}
                      suggestionCount={getSuggestionCount(pr.id)}
                    />
                  </div>
                  <div className="flex flex-col items-end gap-1.5 pt-1">
                    <button
                      onClick={() => handleAnalyze(pr)}
                      disabled={analyzingId === pr.id}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                        analyzingId === pr.id
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                      }`}
                    >
                      {analyzingId === pr.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Sparkles size={13} />
                      )}
                      {analyzingId === pr.id ? '分析中...' : 'AIで分析'}
                    </button>
                    {analyzeResults[pr.id] === 'success' && (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <CheckCircle2 size={12} />
                        提案を生成しました
                      </span>
                    )}
                    {analyzeResults[pr.id] === 'error' && (
                      <span className="flex items-center gap-1 text-xs text-red-500 font-medium max-w-[180px] text-right">
                        <AlertCircle size={12} className="flex-shrink-0" />
                        {errorMessages[pr.id] ?? 'エラーが発生しました'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <GitPullRequest size={22} className="text-slate-400" />
            </div>
            <p className="text-slate-600 font-semibold mb-1">PRが見つかりません</p>
            <p className="text-sm text-slate-400">検索条件を変更してお試しください</p>
          </div>
        )}
      </div>

      {prs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <Bot size={26} className="text-blue-400" />
          </div>
          <p className="text-slate-700 font-semibold mb-1">PRがまだありません</p>
          <p className="text-sm text-slate-400">設定画面でGitHubトークンを設定し、同期するとPRが表示されます</p>
        </div>
      )}
    </div>
  );
}
