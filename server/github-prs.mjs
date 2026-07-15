const GITHUB_API_BASE = 'https://api.github.com';

function jsonResponse(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

function getGitHubHeaders() {
  const headers = {
    accept: 'application/vnd.github+json',
    'user-agent': 'pr-recommender',
    'x-github-api-version': '2022-11-28',
  };

  if (process.env.GITHUB_TOKEN) {
    headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

async function fetchGitHubJson(path) {
  const response = await fetch(`${GITHUB_API_BASE}${path}`, {
    headers: getGitHubHeaders(),
  });

  if (!response.ok) {
    const message = await response.text();
    const error = new Error(`GitHub API error: ${response.status}`);
    error.status = response.status;
    error.details = message;
    throw error;
  }

  return response.json();
}

function detectTechStack(pr) {
  const text = `${pr.title} ${pr.body ?? ''}`.toLowerCase();
  const techs = {
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
    .filter(([, keywords]) => keywords.some(keyword => text.includes(keyword)))
    .map(([name]) => name)
    .slice(0, 5);
}

function mapPullRequest(owner, repo, pr) {
  const repository = `${owner}/${repo}`;
  const status = pr.merged_at ? 'merged' : pr.state === 'closed' ? 'closed' : 'open';

  return {
    id: `${repository}#${pr.number}`,
    number: pr.number,
    title: pr.title,
    description: pr.body ?? '',
    url: pr.html_url,
    repository,
    status,
    mergedAt: pr.merged_at ?? null,
    createdAt: pr.created_at,
    filesChanged: pr.changed_files ?? 0,
    additions: pr.additions ?? 0,
    deletions: pr.deletions ?? 0,
    labels: Array.isArray(pr.labels) ? pr.labels.map(label => label.name).filter(Boolean) : [],
    techStack: detectTechStack(pr),
  };
}

function parsePositiveInt(value, fallback, max) {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

function getStringParam(searchParams, key) {
  const value = searchParams.get(key)?.trim();
  return value || null;
}

export async function fetchPullRequests({ owner, repo, state, perPage, page }) {
  const listPath = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls?state=${state}&sort=created&direction=desc&per_page=${perPage}&page=${page}`;
  const list = await fetchGitHubJson(listPath);

  const detailed = await Promise.all(
    list.map(pr =>
      fetchGitHubJson(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${pr.number}`)
    )
  );

  return detailed.map(pr => mapPullRequest(owner, repo, pr));
}

export async function handleGitHubPrsRequest(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const owner = getStringParam(url.searchParams, 'owner');
  const repo = getStringParam(url.searchParams, 'repo');
  const state = getStringParam(url.searchParams, 'state') ?? 'all';
  const perPage = parsePositiveInt(url.searchParams.get('perPage'), 30, 50);
  const page = parsePositiveInt(url.searchParams.get('page'), 1, 100);

  if (!owner || !repo) {
    jsonResponse(res, 400, { error: 'owner and repo are required' });
    return;
  }

  if (!['open', 'closed', 'all'].includes(state)) {
    jsonResponse(res, 400, { error: 'state must be open, closed, or all' });
    return;
  }

  try {
    const prs = await fetchPullRequests({ owner, repo, state, perPage, page });
    jsonResponse(res, 200, { prs });
  } catch (error) {
    const status = error.status && error.status >= 400 && error.status < 600 ? error.status : 500;
    jsonResponse(res, status, {
      error: error.message,
      details: error.details,
    });
  }
}
