export type PRStatus = 'open' | 'merged' | 'closed';
export type SuggestionStatus = 'not_started' | 'in_progress' | 'published';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface GitHubPR {
  id: string;
  number: number;
  title: string;
  description: string;
  url: string;
  repository: string;
  status: PRStatus;
  mergedAt: string | null;
  createdAt: string;
  filesChanged: number;
  additions: number;
  deletions: number;
  labels: string[];
  techStack: string[];
}

export interface BlogSuggestion {
  id: string;
  prId: string;
  title: string;
  summary: string;
  keyPoints: string[];
  tags: string[];
  difficulty: Difficulty;
  estimatedReadTime: number;
  status: SuggestionStatus;
  createdAt: string;
  score: number;
  draftMarkdown?: string;
}

export interface DashboardStats {
  totalPRsAnalyzed: number;
  totalSuggestions: number;
  publishedCount: number;
  inProgressCount: number;
  newThisWeek: number;
}

export type PageType = 'dashboard' | 'suggestions' | 'pr-analysis' | 'settings';
