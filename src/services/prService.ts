import { supabase, ANON_USER_ID } from '../lib/supabase';
import { GitHubPR, BlogSuggestion } from '../types';

export async function fetchPRsFromDB(): Promise<GitHubPR[]> {
  const { data, error } = await supabase
    .from('github_prs')
    .select('*')
    .eq('user_id', ANON_USER_ID)
    .order('fetched_at', { ascending: false });

  if (error || !data) return [];

  return data.map(row => ({
    id: row.id,
    number: row.number,
    title: row.title,
    description: row.description ?? '',
    url: row.url ?? '',
    repository: row.repository ?? '',
    status: row.status as GitHubPR['status'],
    mergedAt: row.merged_at ?? null,
    createdAt: row.pr_created_at ?? row.fetched_at,
    filesChanged: row.files_changed ?? 0,
    additions: row.additions ?? 0,
    deletions: row.deletions ?? 0,
    labels: row.labels ?? [],
    techStack: row.tech_stack ?? [],
  }));
}

export async function savePRsToDB(prs: GitHubPR[]): Promise<void> {
  const rows = prs.map(pr => ({
    id: pr.id,
    user_id: ANON_USER_ID,
    number: pr.number,
    title: pr.title,
    description: pr.description,
    url: pr.url,
    repository: pr.repository,
    status: pr.status,
    merged_at: pr.mergedAt,
    pr_created_at: pr.createdAt,
    files_changed: pr.filesChanged,
    additions: pr.additions,
    deletions: pr.deletions,
    labels: pr.labels,
    tech_stack: pr.techStack,
    fetched_at: new Date().toISOString(),
  }));

  await supabase
    .from('github_prs')
    .upsert(rows, { onConflict: 'id' });
}

export async function fetchSuggestionsFromDB(): Promise<BlogSuggestion[]> {
  const { data, error } = await supabase
    .from('blog_suggestions')
    .select('*')
    .eq('user_id', ANON_USER_ID)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map(row => ({
    id: row.id,
    prId: row.pr_id,
    title: row.title,
    summary: row.summary ?? '',
    keyPoints: row.key_points ?? [],
    tags: row.tags ?? [],
    difficulty: row.difficulty as BlogSuggestion['difficulty'],
    estimatedReadTime: row.estimated_read_time ?? 10,
    status: row.status as BlogSuggestion['status'],
    createdAt: row.created_at,
    score: row.score ?? 0,
  }));
}

export async function saveSuggestionToDB(suggestion: Omit<BlogSuggestion, 'id' | 'createdAt'>): Promise<BlogSuggestion | null> {
  const { data, error } = await supabase
    .from('blog_suggestions')
    .insert({
      user_id: ANON_USER_ID,
      pr_id: suggestion.prId,
      title: suggestion.title,
      summary: suggestion.summary,
      key_points: suggestion.keyPoints,
      tags: suggestion.tags,
      difficulty: suggestion.difficulty,
      estimated_read_time: suggestion.estimatedReadTime,
      status: suggestion.status,
      score: suggestion.score,
    })
    .select()
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    prId: data.pr_id,
    title: data.title,
    summary: data.summary ?? '',
    keyPoints: data.key_points ?? [],
    tags: data.tags ?? [],
    difficulty: data.difficulty as BlogSuggestion['difficulty'],
    estimatedReadTime: data.estimated_read_time ?? 10,
    status: data.status as BlogSuggestion['status'],
    createdAt: data.created_at,
    score: data.score ?? 0,
  };
}

export async function updateSuggestionStatus(id: string, status: BlogSuggestion['status']): Promise<void> {
  await supabase
    .from('blog_suggestions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
}
