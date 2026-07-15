import { useEffect, useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import Suggestions from './pages/Suggestions';
import PRAnalysis from './pages/PRAnalysis';
import Settings from './pages/Settings';
import SuggestionDetail from './components/suggestion/SuggestionDetail';
import { samplePRs, sampleSuggestions } from './data/sampleData';
import { fetchSavedSuggestions } from './services/suggestions';
import { BlogSuggestion, GitHubPR, PageType, SuggestionStatus } from './types';
import './App.css';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [prs, setPRs] = useState<GitHubPR[]>(samplePRs);
  const [suggestions, setSuggestions] = useState(sampleSuggestions);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetchSavedSuggestions()
      .then(savedSuggestions => {
        if (active && savedSuggestions.length > 0) {
          setSuggestions(savedSuggestions);
        }
      })
      .catch(() => {
        if (active) {
          setSuggestions(sampleSuggestions);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleStatusChange = (id: string, status: SuggestionStatus) => {
    setSuggestions(prev =>
      prev.map(s => s.id === id ? { ...s, status } : s)
    );
  };

  const handleSuggestionGenerated = (suggestion: BlogSuggestion) => {
    setSuggestions(prev => [suggestion, ...prev]);
    setSelectedSuggestionId(suggestion.id);
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
              onSuggestionGenerated={handleSuggestionGenerated}
            />
          )}
          {currentPage === 'settings' && (
            <Settings onPRsFetched={setPRs} />
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
