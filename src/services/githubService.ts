import { GitHubPR } from '../types';

interface GitHubApiPR {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  base: { repo: { full_name: string } };
  state: string;
  pull_request?: { merged_at: string | null };
  merged_at?: string | null;
  created_at: string;
  labels: { name: string }[];
}

interface GitHubSearchItem extends GitHubApiPR {
  pull_request: { merged_at: string | null };
}

function detectTechStack(pr: GitHubApiPR): string[] {
  const text = `${pr.title} ${pr.body ?? ''}`.toLowerCase();
  const techs: Record<string, string[]> = {
    TypeScript: ['typescript', '.ts', 'tsx'],
    JavaScript: ['javascript', '.js', 'jsx', 'node'],
    React: ['react', 'jsx', 'tsx'],
    Vue: ['vue', 'nuxt'],
    Python: ['python', '.py', 'django', 'flask', 'fastapi'],
    Go: ['golang', ' go ', 'goroutine'],
    Rust: ['rust', 'cargo'],
    Java: ['java', 'spring', 'maven', 'gradle'],
    Docker: ['docker', 'container', 'dockerfile'],
    Kubernetes: ['kubernetes', 'k8s', 'helm'],
    AWS: ['aws', 'lambda', 's3', 'ec2', 'cloudformation'],
    GraphQL: ['graphql', 'apollo'],
    PostgreSQL: ['postgres', 'postgresql', 'supabase'],
    MySQL: ['mysql', 'mariadb'],
    Redis: ['redis', 'cache'],
  };
  return Object.entries(techs)
    .filter(([, keywords]) => keywords.some(k => text.includes(k)))
    .map(([name]) => name)
    .slice(0, 5);
}

async function fetchPRDetails(
  owner: string,
  repo: string,
  number: number,
  token: string
): Promise<{ filesChanged: number; additions: number; deletions: number }> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${number}`,
      { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } }
    );
    if (!res.ok) return { filesChanged: 0, additions: 0, deletions: 0 };
    const data = await res.json();
    return {
      filesChanged: data.changed_files ?? 0,
      additions: data.additions ?? 0,
      deletions: data.deletions ?? 0,
    };
  } catch {
    return { filesChanged: 0, additions: 0, deletions: 0 };
  }
}

export async function fetchGitHubPRs(
  username: string,
  token: string
): Promise<GitHubPR[]> {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
  };

  const url = `https://api.github.com/search/issues?q=author:${encodeURIComponent(username)}+type:pr&sort=created&order=desc&per_page=30`;
  const res = await fetch(url, { headers });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`GitHub API error: ${res.status} ${msg}`);
  }

  const json = await res.json();
  const items: GitHubSearchItem[] = json.items ?? [];

  const prs = await Promise.all(
    items.map(async (item): Promise<GitHubPR> => {
      const repoFullName = item.base?.repo?.full_name ?? item.html_url.split('/').slice(3, 5).join('/');
      const [owner, repo] = repoFullName.split('/');

      let status: GitHubPR['status'] = 'open';
      if (item.pull_request?.merged_at) {
        status = 'merged';
      } else if (item.state === 'closed') {
        status = 'closed';
      }

      const details = await fetchPRDetails(owner, repo, item.number, token);

      return {
        id: `${repoFullName}#${item.number}`,
        number: item.number,
        title: item.title,
        description: item.body ?? '',
        url: item.html_url,
        repository: repoFullName,
        status,
        mergedAt: item.pull_request?.merged_at ?? null,
        createdAt: item.created_at,
        filesChanged: details.filesChanged,
        additions: details.additions,
        deletions: details.deletions,
        labels: item.labels.map(l => l.name),
        techStack: detectTechStack(item),
      };
    })
  );

  return prs;
}
