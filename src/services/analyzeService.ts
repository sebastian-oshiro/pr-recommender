import { GitHubPR, BlogSuggestion } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export async function analyzePRWithAI(
  pr: GitHubPR
): Promise<Omit<BlogSuggestion, 'id' | 'createdAt' | 'status'>> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-pr`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ pr }),
  });

  const json = await response.json();

  if (!response.ok || json.error) {
    throw new Error(json.error || 'AI分析に失敗しました');
  }

  const s = json.suggestion;

  return {
    prId: pr.id,
    title: s.title ?? '',
    summary: s.summary ?? '',
    keyPoints: Array.isArray(s.keyPoints) ? s.keyPoints : [],
    tags: Array.isArray(s.tags) ? s.tags : [],
    difficulty: (['beginner', 'intermediate', 'advanced'].includes(s.difficulty) ? s.difficulty : 'intermediate') as BlogSuggestion['difficulty'],
    estimatedReadTime: typeof s.estimatedReadTime === 'number' ? s.estimatedReadTime : 10,
    score: typeof s.score === 'number' ? Math.min(100, Math.max(0, s.score)) : 75,
  };
}
