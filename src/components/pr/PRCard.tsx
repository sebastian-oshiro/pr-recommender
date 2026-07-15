import { ExternalLink, Plus, Minus, FileCode2, GitMerge, GitPullRequest, Circle } from 'lucide-react';
import { GitHubPR } from '../../types';
import { PRStatusBadge } from '../common/StatusBadge';

interface PRCardProps {
  pr: GitHubPR;
  suggestionCount?: number;
  onClick?: () => void;
}

const statusIcons = {
  merged: GitMerge,
  open: GitPullRequest,
  closed: Circle,
};

const statusIconColors = {
  merged: 'text-violet-600',
  open: 'text-emerald-600',
  closed: 'text-slate-400',
};

export default function PRCard({ pr, suggestionCount = 0, onClick }: PRCardProps) {
  const StatusIcon = statusIcons[pr.status];
  const iconColor = statusIconColors[pr.status];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className="bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer group p-5"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5`}>
          <StatusIcon size={18} className={iconColor} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs text-slate-400 font-mono">#{pr.number}</span>
                <PRStatusBadge status={pr.status} />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug line-clamp-2">
                {pr.title}
              </h3>
            </div>
            <a
              href={pr.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink size={13} />
            </a>
          </div>

          <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">
            {pr.description}
          </p>

          <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
            <span className="font-medium text-slate-600">{pr.repository}</span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1">
              <FileCode2 size={11} />
              {pr.filesChanged}ファイル
            </span>
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <Plus size={11} />
              {pr.additions}
            </span>
            <span className="flex items-center gap-1 text-red-500 font-medium">
              <Minus size={11} />
              {pr.deletions}
            </span>
            <span className="ml-auto">
              {pr.mergedAt ? `マージ: ${formatDate(pr.mergedAt)}` : `作成: ${formatDate(pr.createdAt)}`}
            </span>
          </div>

          {pr.techStack.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {pr.techStack.map(tech => (
                <span key={tech} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-medium">
                  {tech}
                </span>
              ))}
            </div>
          )}

          {suggestionCount > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-blue-600 font-medium">
                💡 {suggestionCount}件のブログ提案あり
              </span>
              <span className="text-xs text-slate-400 group-hover:text-blue-500 transition-colors">詳細を見る →</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
