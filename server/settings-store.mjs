import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const defaultStorePath = join(rootDir, '.data', 'settings.json');
const storePath = process.env.SETTINGS_STORE_PATH || defaultStorePath;

const defaultSettings = {
  owner: '',
  repo: '',
  syncInterval: 'daily',
  minScore: 75,
  notifyNew: true,
  notifyWeekly: true,
};

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
    if (size > 32 * 1024) {
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

function normalizeSyncInterval(value) {
  return ['realtime', 'daily', 'weekly'].includes(value) ? value : defaultSettings.syncInterval;
}

function normalizeBoolean(value, fallback) {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeScore(value) {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return defaultSettings.minScore;
  return Math.min(100, Math.max(50, Math.round(number)));
}

function normalizeSettings(input = {}) {
  const source = input && typeof input === 'object' ? input : {};

  return {
    owner: normalizeString(source.owner),
    repo: normalizeString(source.repo),
    syncInterval: normalizeSyncInterval(source.syncInterval),
    minScore: normalizeScore(source.minScore),
    notifyNew: normalizeBoolean(source.notifyNew, defaultSettings.notifyNew),
    notifyWeekly: normalizeBoolean(source.notifyWeekly, defaultSettings.notifyWeekly),
  };
}

export async function loadSettings() {
  try {
    const content = await readFile(storePath, 'utf8');
    return normalizeSettings(JSON.parse(content));
  } catch (error) {
    if (error.code === 'ENOENT') return { ...defaultSettings };
    throw error;
  }
}

export async function saveSettings(input) {
  const settings = normalizeSettings(input);
  await mkdir(dirname(storePath), { recursive: true });
  await writeFile(storePath, `${JSON.stringify(settings, null, 2)}\n`, 'utf8');
  return settings;
}

export async function handleSettingsStoreRequest(req, res) {
  try {
    if (req.method === 'GET') {
      const settings = await loadSettings();
      jsonResponse(res, 200, { settings });
      return;
    }

    if (req.method === 'PUT') {
      const body = await readJsonBody(req);
      const settings = await saveSettings(body.settings ?? body);
      jsonResponse(res, 200, { settings });
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
