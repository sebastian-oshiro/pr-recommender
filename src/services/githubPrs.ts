import { GitHubPR } from '../types';

interface FetchGitHubPrsParams {
  owner: string;
  repo: string;
  state?: 'open' | 'closed' | 'all';
}

interface FetchGitHubPrsResponse {
  prs: GitHubPR[];
  error?: string;
  details?: string;
}

export async function fetchGitHubPRs(params: FetchGitHubPrsParams): Promise<GitHubPR[]> {
  const searchParams = new URLSearchParams({
    owner: params.owner,
    repo: params.repo,
    state: params.state ?? 'all',
  });

  const response = await fetch(`/api/github/prs?${searchParams.toString()}`);
  const payload = await response.json() as FetchGitHubPrsResponse;

  if (!response.ok) {
    throw new Error(payload.details || payload.error || 'GitHub PRの取得に失敗しました');
  }

  return payload.prs;
}
