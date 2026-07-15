import { BlogSuggestion, GitHubPR } from '../types';

export type GeneratedSuggestion = Omit<BlogSuggestion, 'id' | 'createdAt' | 'status'>;
export type NewSuggestion = Omit<BlogSuggestion, 'id' | 'createdAt'>;

interface GenerateSuggestionResponse {
  suggestion?: GeneratedSuggestion;
  error?: string;
}

interface SuggestionsResponse {
  suggestions?: BlogSuggestion[];
  suggestion?: BlogSuggestion;
  error?: string;
}

export async function generateSuggestion(pr: GitHubPR): Promise<GeneratedSuggestion> {
  const response = await fetch('/api/suggestions/generate', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ pr }),
  });
  const payload = await response.json() as GenerateSuggestionResponse;

  if (!response.ok || !payload.suggestion) {
    throw new Error(payload.error || '記事テーマ生成に失敗しました');
  }

  return payload.suggestion;
}

export async function fetchSavedSuggestions(): Promise<BlogSuggestion[]> {
  const response = await fetch('/api/suggestions');
  const payload = await response.json() as SuggestionsResponse;

  if (!response.ok || !payload.suggestions) {
    throw new Error(payload.error || '提案データの取得に失敗しました');
  }

  return payload.suggestions;
}

export async function saveSuggestion(suggestion: NewSuggestion): Promise<BlogSuggestion> {
  const response = await fetch('/api/suggestions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ suggestion }),
  });
  const payload = await response.json() as SuggestionsResponse;

  if (!response.ok || !payload.suggestion) {
    throw new Error(payload.error || '提案データの保存に失敗しました');
  }

  return payload.suggestion;
}
