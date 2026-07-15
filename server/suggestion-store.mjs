import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const defaultStorePath = join(rootDir, '.data', 'suggestions.json');
const storePath = process.env.SUGGESTIONS_STORE_PATH || defaultStorePath;

function jsonResponse(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

async function readJsonBody(req) {
  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;
    if (size > 128 * 1024) {
      const error = new Error('request body is too large');
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function normalizeString(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(item => typeof item === 'string')
    .map(item => item.trim())
    .filter(Boolean);
}

function normalizeDifficulty(value) {
  return ['beginner', 'intermediate', 'advanced'].includes(value) ? value : 'intermediate';
}

function normalizeStatus(value) {
  return ['not_started', 'in_progress', 'published'].includes(value) ? value : 'not_started';
}

function assertSuggestionStatus(value) {
  if (['not_started', 'in_progress', 'published'].includes(value)) {
    return value;
  }

  const error = new Error('status must be one of: not_started, in_progress, published');
  error.status = 400;
  throw error;
}

function normalizeNumber(value, fallback, min, max) {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

function normalizeSuggestion(input) {
  const prId = normalizeString(input.prId);
  const title = normalizeString(input.title);

  if (!prId) {
    throw new Error('suggestion.prId is required');
  }
  if (!title) {
    throw new Error('suggestion.title is required');
  }

  return {
    id: normalizeString(input.id, randomUUID()),
    prId,
    title,
    summary: normalizeString(input.summary),
    keyPoints: normalizeStringArray(input.keyPoints),
    tags: normalizeStringArray(input.tags),
    difficulty: normalizeDifficulty(input.difficulty),
    estimatedReadTime: normalizeNumber(input.estimatedReadTime, 10, 1, 60),
    status: normalizeStatus(input.status),
    createdAt: normalizeString(input.createdAt, new Date().toISOString()),
    score: normalizeNumber(input.score, 75, 0, 100),
    draftMarkdown: normalizeString(input.draftMarkdown) || undefined,
  };
}

async function readSuggestions() {
  try {
    const content = await readFile(storePath, 'utf8');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed.map(normalizeSuggestion) : [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function writeSuggestions(suggestions) {
  await mkdir(dirname(storePath), { recursive: true });
  await writeFile(storePath, `${JSON.stringify(suggestions, null, 2)}\n`, 'utf8');
}

export async function saveSuggestion(input) {
  const suggestion = normalizeSuggestion(input);
  const suggestions = await readSuggestions();
  const withoutDuplicate = suggestions.filter(item => item.id !== suggestion.id);
  const nextSuggestions = [suggestion, ...withoutDuplicate]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  await writeSuggestions(nextSuggestions);
  return suggestion;
}

export async function updateSuggestionStatus(id, status) {
  const normalizedId = normalizeString(id);

  if (!normalizedId) {
    throw new Error('suggestion id is required');
  }

  const normalizedStatus = assertSuggestionStatus(status);

  const suggestions = await readSuggestions();
  const index = suggestions.findIndex(item => item.id === normalizedId);

  if (index === -1) {
    const error = new Error('suggestion not found');
    error.status = 404;
    throw error;
  }

  const updated = {
    ...suggestions[index],
    status: normalizedStatus,
  };
  const nextSuggestions = [...suggestions];
  nextSuggestions[index] = updated;

  await writeSuggestions(nextSuggestions);
  return updated;
}

export async function handleSuggestionStoreRequest(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost');
    const statusMatch = url.pathname.match(/^\/api\/suggestions\/([^/]+)\/status$/);

    if (req.method === 'PATCH' && statusMatch) {
      const body = await readJsonBody(req);
      const suggestion = await updateSuggestionStatus(decodeURIComponent(statusMatch[1]), body.status);
      jsonResponse(res, 200, { suggestion });
      return;
    }

    if (req.method === 'GET') {
      const suggestions = await readSuggestions();
      jsonResponse(res, 200, { suggestions });
      return;
    }

    if (req.method === 'POST') {
      const body = await readJsonBody(req);
      const suggestion = await saveSuggestion(body.suggestion ?? body);
      jsonResponse(res, 201, { suggestion });
      return;
    }

    jsonResponse(res, 405, { error: 'method not allowed' });
  } catch (error) {
    const status = error.status && error.status >= 400 && error.status < 600 ? error.status : 500;
    jsonResponse(res, status, {
      error: error.message,
    });
  }
}
