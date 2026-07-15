import { BlogSuggestion, GitHubPR } from '../types';

export type GeneratedSuggestion = Omit<BlogSuggestion, 'id' | 'createdAt' | 'status'>;

interface GenerateSuggestionResponse {
  suggestion?: GeneratedSuggestion;
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
