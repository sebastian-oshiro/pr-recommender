import { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import Suggestions from './pages/Suggestions';
import PRAnalysis from './pages/PRAnalysis';
import Settings from './pages/Settings';
import SuggestionDetail from './components/suggestion/SuggestionDetail';
import { PageType, BlogSuggestion, GitHubPR, SuggestionStatus } from './types';
import { fetchPRsFromDB, fetchSuggestionsFromDB, savePRsToDB, updateSuggestionStatus } from './services/prService';
import { loadSettings } from './services/settingsService';
import { fetchGitHubPRs } from './services/githubService';
import './App.css';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [prs, setPRs] = useState<GitHubPR[]>([]);
  const [suggestions, setSuggestions] = useState<BlogSuggestion[]>([]);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);
  const [githubUsername, setGithubUsername] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    async function initData() {
      const [dbPRs, dbSuggestions, settings] = await Promise.all([
        fetchPRsFromDB(),
        fetchSuggestionsFromDB(),
        loadSettings(),
      ]);

      setGithubUsername(settings.githubUsername);
      setGithubToken(settings.githubToken);

      setPRs(dbPRs);
      setSuggestions(dbSuggestions);

      setDataLoaded(true);
    }

    initData();
  }, []);

  const handleStatusChange = async (id: string, status: SuggestionStatus) => {
    setSuggestions(prev =>
      prev.map(s => s.id === id ? { ...s, status } : s)
    );
    await updateSuggestionStatus(id, status);
  };

  const handleSuggestionCreated = (suggestion: BlogSuggestion) => {
    setSuggestions(prev => [suggestion, ...prev]);
  };

  const handleSync = async (username: string, token: string) => {
    if (!username || !token) {
      setSyncError('GitHubユーザー名とトークンを設定してください');
      return;
    }
    setSyncing(true);
    setSyncError(null);
    try {
      const fetchedPRs = await fetchGitHubPRs(username, token);
      await savePRsToDB(fetchedPRs);
      setPRs(fetchedPRs);
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'GitHub同期に失敗しました');
    } finally {
      setSyncing(false);
    }
  };

  const handleSettingsChange = (key: 'githubUsername' | 'githubToken', value: string) => {
    if (key === 'githubUsername') setGithubUsername(value);
    if (key === 'githubToken') setGithubToken(value);
  };

  const selectedSuggestion = selectedSuggestionId
    ? suggestions.find(s => s.id === selectedSuggestionId)
    : null;
  const selectedPR = selectedSuggestion
    ? prs.find(p => p.id === selectedSuggestion.prId)
    : undefined;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          currentPage={currentPage}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">
          {!dataLoaded ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {currentPage === 'dashboard' && (
                <Dashboard
                  prs={prs}
                  suggestions={suggestions}
                  onSuggestionClick={setSelectedSuggestionId}
                  onStatusChange={handleStatusChange}
                  onNavigate={setCurrentPage}
                />
              )}
              {currentPage === 'suggestions' && (
                <Suggestions
                  prs={prs}
                  suggestions={suggestions}
                  onSuggestionClick={setSelectedSuggestionId}
                  onStatusChange={handleStatusChange}
                />
              )}
              {currentPage === 'pr-analysis' && (
                <PRAnalysis
                  prs={prs}
                  suggestions={suggestions}
                  onSuggestionCreated={handleSuggestionCreated}
                />
              )}
              {currentPage === 'settings' && (
                <Settings
                  onSettingsChange={handleSettingsChange}
                  onSync={handleSync}
                  syncing={syncing}
                  syncError={syncError}
                  githubUsername={githubUsername}
                  githubToken={githubToken}
                />
              )}
            </>
          )}
        </main>
      </div>

      {selectedSuggestion && (
        <SuggestionDetail
          suggestion={selectedSuggestion}
          pr={selectedPR}
          onClose={() => setSelectedSuggestionId(null)}
          onStatusChange={(id, status) => {
            handleStatusChange(id, status);
            setSelectedSuggestionId(null);
          }}
        />
      )}
    </div>
  );
}
