import { useState } from 'react';
import { Github, Key, Bell, RefreshCw, Check, CircleAlert as AlertCircle, FileSliders as Sliders } from 'lucide-react';
import { fetchGitHubPRs } from '../services/githubPrs';
import { GitHubPR } from '../types';

interface UserSettings {
  owner: string;
  repo: string;
  syncInterval: string;
  minScore: number;
  notifyNew: boolean;
  notifyWeekly: boolean;
}

interface SettingsProps {
  onPRsFetched: (prs: GitHubPR[]) => void;
}

export default function Settings({ onPRsFetched }: SettingsProps) {
  const [settings, setSettings] = useState<UserSettings>({
    owner: '',
    repo: '',
    syncInterval: 'daily',
    minScore: 75,
    notifyNew: true,
    notifyWeekly: true,
  });
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const update = (patch: Partial<UserSettings>) =>
    setSettings(prev => ({ ...prev, ...patch }));

  const handleSync = async () => {
    setSyncing(true);
    setSyncError(null);
    setSyncResult(null);

    try {
      const prs = await fetchGitHubPRs({
        owner: settings.owner,
        repo: settings.repo,
        state: 'all',
      });
      onPRsFetched(prs);
      setSyncResult(`${prs.length}件のPRを取得しました`);
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'GitHub PRの取得に失敗しました');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
            <Github size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">GitHub連携</h2>
            <p className="text-xs text-slate-500">アカウントとリポジトリの設定</p>
          </div>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">リポジトリオーナー</label>
            <input
              type="text"
              value={settings.owner}
              onChange={e => update({ owner: e.target.value })}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
              placeholder="例: openai"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">リポジトリ名</label>
            <input
              type="text"
              value={settings.repo}
              onChange={e => update({ repo: e.target.value })}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
              placeholder="例: openai-node"
            />
            <div className="flex items-start gap-2 mt-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <AlertCircle size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                <strong>認証情報：</strong> Private Repositoryを取得する場合は、サーバー側の <code className="bg-amber-100 px-1 rounded">GITHUB_TOKEN</code> を設定してください。ブラウザにはトークンを入力しません。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-600 flex items-center justify-center">
            <Sliders size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">解析の設定</h2>
            <p className="text-xs text-slate-500">PR解析の動作をカスタマイズ</p>
          </div>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">同期間隔</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'realtime', label: 'リアルタイム' },
                { value: 'daily', label: '毎日' },
                { value: 'weekly', label: '毎週' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => update({ syncInterval: opt.value })}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    settings.syncInterval === opt.value
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">最低スコアしきい値</label>
              <span className="text-sm font-bold text-blue-600">{settings.minScore}</span>
            </div>
            <input
              type="range"
              min={50}
              max={100}
              value={settings.minScore}
              onChange={e => update({ minScore: Number(e.target.value) })}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>50（全て表示）</span>
              <span>100（最高のみ）</span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Bell size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">通知設定</h2>
            <p className="text-xs text-slate-500">通知の受け取り方を設定</p>
          </div>
        </div>
        <div className="px-6 py-5 space-y-4">
          {[
            { id: 'new', label: '新しい提案が届いたとき', desc: '新しいブログネタが見つかったらすぐに通知', checked: settings.notifyNew, key: 'notifyNew' as const },
            { id: 'weekly', label: 'ウィークリーサマリー', desc: '週に一度、未着手の提案をまとめてお知らせ', checked: settings.notifyWeekly, key: 'notifyWeekly' as const },
          ].map(item => (
            <label key={item.id} className="flex items-start gap-4 cursor-pointer group">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={item.checked}
                  onChange={e => update({ [item.key]: e.target.checked })}
                />
                <div className={`w-10 h-6 rounded-full transition-colors ${item.checked ? 'bg-blue-600' : 'bg-slate-200'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${item.checked ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </section>

      <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <Key size={15} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700">
          GitHub APIはサーバー側から呼び出します。Public Repositoryはトークンなしでも取得できますが、rate limitやPrivate Repository対応には <code className="bg-blue-100 px-1 rounded">GITHUB_TOKEN</code> が必要です。
        </p>
      </div>

      {saved && (
        <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <Check size={15} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-700 font-medium">表示上の保存状態を更新しました</p>
        </div>
      )}

      {syncError && (
        <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
          <AlertCircle size={15} className="text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{syncError}</p>
        </div>
      )}

      {syncResult && (
        <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <Check size={15} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-700 font-medium">{syncResult}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={handleSync}
          disabled={syncing || !settings.owner || !settings.repo}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl transition-all font-medium ${
            syncing || !settings.owner || !settings.repo
              ? 'text-slate-400 bg-slate-100 cursor-not-allowed'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
          {syncing ? '取得中...' : 'PRを取得'}
        </button>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
            saved
              ? 'bg-emerald-600 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {saved ? <Check size={15} /> : null}
          {saved ? '保存しました' : '変更を保存'}
        </button>
      </div>
    </div>
  );
}
