import { LayoutDashboard, Lightbulb, GitPullRequest, Settings, Github, BookOpen, ChevronRight } from 'lucide-react';
import { PageType } from '../../types';

interface SidebarProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { id: 'dashboard' as PageType, label: 'ダッシュボード', icon: LayoutDashboard },
  { id: 'suggestions' as PageType, label: 'ブログ提案', icon: Lightbulb },
  { id: 'pr-analysis' as PageType, label: 'PR一覧', icon: GitPullRequest },
  { id: 'settings' as PageType, label: '設定', icon: Settings },
];

export default function Sidebar({ currentPage, onNavigate, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-slate-900 z-30 flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700/60">
          <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-base leading-tight block">ブログ</span>
            <span className="text-blue-400 font-bold text-base leading-tight block">リコメンダー</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ id, label, icon: Icon }) => {
            const active = currentPage === id;
            return (
              <button
                key={id}
                onClick={() => { onNavigate(id); onClose(); }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-150 group
                  ${active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }
                `}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} size={18} />
                <span className="flex-1 text-left">{label}</span>
                {active && <ChevronRight size={14} className="opacity-70" />}
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-slate-700/60">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
              <Github size={15} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">preview-user</p>
              <p className="text-slate-500 text-xs truncate">UIプレビュー</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
