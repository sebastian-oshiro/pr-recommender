import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleGitHubPrsRequest } from './github-prs.mjs';
import { handleSuggestionGenerationRequest } from './suggestions.mjs';
import { handleSuggestionStoreRequest } from './suggestion-store.mjs';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const distDir = join(rootDir, 'dist');
const port = Number.parseInt(process.env.PORT ?? '5173', 10);
const host = process.env.HOST ?? '127.0.0.1';
const isProduction = process.env.NODE_ENV === 'production';

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function serveStatic(req, res) {
  const requestUrl = new URL(req.url ?? '/', `http://${host}:${port}`);
  const pathname = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
  const normalized = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  const filePath = join(distDir, normalized);
  const targetPath = existsSync(filePath) && statSync(filePath).isFile()
    ? filePath
    : join(distDir, 'index.html');
  const extension = extname(targetPath);

  res.writeHead(200, {
    'content-type': contentTypes[extension] ?? 'application/octet-stream',
  });
  createReadStream(targetPath).pipe(res);
}

async function createRequestHandler() {
  if (isProduction) {
    return (req, res) => serveStatic(req, res);
  }

  const vite = await import('vite');
  const viteServer = await vite.createServer({
    appType: 'spa',
    root: rootDir,
    server: {
      hmr: false,
      middlewareMode: true,
    },
  });

  return (req, res) => viteServer.middlewares(req, res);
}

const handleAppRequest = await createRequestHandler();

const server = createServer((req, res) => {
  if (req.url?.startsWith('/api/github/prs')) {
    void handleGitHubPrsRequest(req, res);
    return;
  }

  if (req.url?.startsWith('/api/suggestions/generate')) {
    void handleSuggestionGenerationRequest(req, res);
    return;
  }

  if (req.url?.startsWith('/api/suggestions')) {
    void handleSuggestionStoreRequest(req, res);
    return;
  }

  handleAppRequest(req, res);
});

server.listen(port, host, () => {
  console.log(`PR Recommender server running at http://${host}:${port}/`);
});
