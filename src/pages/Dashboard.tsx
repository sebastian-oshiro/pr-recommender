import { GitPullRequest, Lightbulb, BookCheck, PenLine, Sparkles, ArrowRight, TrendingUp } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import SuggestionCard from '../components/suggestion/SuggestionCard';
import { BlogSuggestion, GitHubPR, SuggestionStatus, PageType } from '../types';

interface DashboardProps {
  prs: GitHubPR[];
  suggestions: BlogSuggestion[];
  onSuggestionClick: (id: string) => void;
  onStatusChange: (id: string, status: SuggestionStatus) => void;
  onNavigate: (page: PageType) => void;
}

export default function Dashboard({ prs, suggestions, onSuggestionClick, onStatusChange, onNavigate }: DashboardProps) {
  const topSuggestions = suggestions
    .filter(s => s.status === 'not_started')
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const recentActivity = suggestions
    .filter(s => s.status !== 'not_started')
    .slice(0, 2);

  const publishedCount = suggestions.filter(s => s.status === 'published').length;
  const inProgressCount = suggestions.filter(s => s.status === 'in_progress').length;

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-6xl mx-auto">
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute right-16 bottom-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={18} className="text-blue-200" />
            <span className="text-blue-200 text-sm font-medium">今週の新着</span>
          </div>
          <h2 className="text-2xl font-bold mb-1">
            {topSuggestions.length}件のブログネタが見つかりました
          </h2>
          <p className="text-blue-200 text-sm mb-5">
            あなたのPRから自動的にブログの題材を発掘しました。
          </p>
          <button
            onClick={() => onNavigate('suggestions')}
            className="flex items-center gap-2 bg-white text-blue-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors shadow-sm"
          >
            提案を見る
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          title="解析済みPR"
          value={prs.length}
          icon={GitPullRequest}
          color="slate"
        />
        <StatCard
          title="ブログ提案数"
          value={suggestions.length}
          icon={Lightbulb}
          trend="今月+4"
          trendUp
          color="blue"
        />
        <StatCard
          title="公開済み記事"
          value={publishedCount}
          icon={BookCheck}
          trend="今月+2"
          trendUp
          color="emerald"
        />
        <StatCard
          title="執筆中"
          value={inProgressCount}
          icon={PenLine}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">おすすめのブログ提案</h2>
            </div>
            <button
              onClick={() => onNavigate('suggestions')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              すべて見る
              <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {topSuggestions.map(suggestion => {
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
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <PenLine size={18} className="text-amber-600" />
            <h2 className="text-base font-bold text-slate-900">最近のアクティビティ</h2>
          </div>
          <div className="space-y-3">
            {recentActivity.length > 0 ? recentActivity.map(suggestion => (
              <div
                key={suggestion.id}
                className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all"
                onClick={() => onSuggestionClick(suggestion.id)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${suggestion.status === 'in_progress' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  <span className="text-xs font-medium text-slate-500">
                    {suggestion.status === 'in_progress' ? '執筆中' : '公開済み'}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">
                  {suggestion.title}
                </p>
              </div>
            )) : (
              <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 p-6 text-center">
                <p className="text-sm text-slate-400">まだアクティビティがありません</p>
              </div>
            )}

            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">進捗サマリー</h3>
              <div className="space-y-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-600">公開率</span>
                    <span className="text-xs font-bold text-emerald-600">
                      {suggestions.length > 0 ? Math.round((publishedCount / suggestions.length) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div
                      className="bg-emerald-500 rounded-full h-1.5 transition-all duration-500"
                      style={{ width: `${suggestions.length > 0 ? (publishedCount / suggestions.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-600">執筆着手率</span>
                    <span className="text-xs font-bold text-amber-600">
                      {suggestions.length > 0 ? Math.round(((publishedCount + inProgressCount) / suggestions.length) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div
                      className="bg-amber-400 rounded-full h-1.5 transition-all duration-500"
                      style={{ width: `${suggestions.length > 0 ? ((publishedCount + inProgressCount) / suggestions.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
