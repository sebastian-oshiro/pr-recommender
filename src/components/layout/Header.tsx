import { Menu, Bell, RefreshCw } from 'lucide-react';
import { PageType } from '../../types';

const pageTitles: Record<PageType, { title: string; subtitle: string }> = {
  dashboard: { title: 'ダッシュボード', subtitle: 'PRからブログネタを自動発掘' },
  suggestions: { title: 'ブログ提案', subtitle: 'AIが選んだあなたの技術ブログ候補' },
  'pr-analysis': { title: 'PR一覧', subtitle: '解析済みのプルリクエスト' },
  settings: { title: '設定', subtitle: 'アカウントと連携の管理' },
};

interface HeaderProps {
  currentPage: PageType;
  onMenuClick: () => void;
}

export default function Header({ currentPage, onMenuClick }: HeaderProps) {
  const { title, subtitle } = pageTitles[currentPage];

  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200 px-4 lg:px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Menu size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">{title}</h1>
            <p className="text-xs text-slate-500 hidden sm:block">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <RefreshCw size={15} className="text-slate-500" />
            <span className="hidden sm:inline">同期</span>
          </button>
          <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full" />
          </button>
        </div>
      </div>
    </header>
  );
}
