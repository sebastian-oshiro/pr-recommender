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

function requireString(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function normalizeStringArray(value, fallback = []) {
  if (!Array.isArray(value)) return fallback;
  return value
    .filter(item => typeof item === 'string')
    .map(item => item.trim())
    .filter(Boolean);
}

function normalizeDifficulty(value) {
  return ['beginner', 'intermediate', 'advanced'].includes(value) ? value : 'intermediate';
}

function normalizeNumber(value, fallback, min, max) {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

function extractJson(content) {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1];

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AIの応答からJSONを解析できませんでした');
  }
  return jsonMatch[0];
}

function normalizeSuggestion(rawSuggestion, pr) {
  return {
    prId: pr.id,
    title: requireString(rawSuggestion.title),
    summary: requireString(rawSuggestion.summary),
    keyPoints: normalizeStringArray(rawSuggestion.keyPoints).slice(0, 6),
    tags: normalizeStringArray(rawSuggestion.tags).slice(0, 6),
    difficulty: normalizeDifficulty(rawSuggestion.difficulty),
    estimatedReadTime: normalizeNumber(rawSuggestion.estimatedReadTime, 10, 1, 60),
    score: normalizeNumber(rawSuggestion.score, 75, 0, 100),
    draftMarkdown: requireString(rawSuggestion.draftMarkdown),
  };
}

function validatePr(pr) {
  if (!pr || typeof pr !== 'object') {
    throw new Error('pr is required');
  }

  for (const key of ['id', 'title', 'repository']) {
    if (!requireString(pr[key])) {
      throw new Error(`pr.${key} is required`);
    }
  }
}

function buildPrompt(pr) {
  return `あなたは技術ブログの編集者です。以下のGitHub PR情報だけを根拠に、日本語の技術ブログテーマと記事下書きを1件生成してください。

制約:
- PR情報にない事実を断定しない
- 推測が必要な箇所は「確認したい点」として下書き内に明示する
- 実装詳細が少ない場合でも、読者が得られる学びをPR情報から抽出する
- JSONのみを返す

PR情報:
- ID: ${pr.id}
- タイトル: ${pr.title}
- リポジトリ: ${pr.repository}
- 説明: ${pr.description || 'なし'}
- ステータス: ${pr.status}
- 変更ファイル数: ${pr.filesChanged}
- 追加行数: ${pr.additions}
- 削除行数: ${pr.deletions}
- ラベル: ${(pr.labels ?? []).join(', ') || 'なし'}
- 技術スタック: ${(pr.techStack ?? []).join(', ') || 'なし'}

出力JSON:
{
  "title": "記事タイトル",
  "summary": "2〜3文の概要",
  "keyPoints": ["記事のポイント1", "記事のポイント2", "記事のポイント3"],
  "tags": ["タグ1", "タグ2", "タグ3"],
  "difficulty": "beginner | intermediate | advanced",
  "estimatedReadTime": 8,
  "score": 80,
  "draftMarkdown": "# タイトル\\n\\n## 導入\\n...\\n\\n## 背景\\n...\\n\\n## 実装のポイント\\n...\\n\\n## 確認したい点\\n...\\n\\n## まとめ\\n..."
}`;
}

function extractResponseText(data) {
  if (typeof data?.output_text === 'string') {
    return data.output_text;
  }

  const textParts = data?.output
    ?.flatMap(item => item?.content ?? [])
    ?.map(content => content?.text)
    ?.filter(Boolean);

  return textParts?.join('\n') ?? '';
}

async function callGrok(prompt) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    const error = new Error('XAI_API_KEY is not configured');
    error.status = 500;
    throw error;
  }

  const response = await fetch('https://api.x.ai/v1/responses', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.XAI_MODEL || 'grok-4.5',
      input: prompt,
      temperature: 0.5,
      max_output_tokens: 2200,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = body?.error?.message || response.statusText;
    const error = new Error(`xAI API error: ${message}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  const content = extractResponseText(data);
  if (!content) {
    throw new Error('AIからの応答が空です');
  }

  return content;
}

export async function generateSuggestionForPr(pr) {
  validatePr(pr);
  const content = await callGrok(buildPrompt(pr));
  const parsed = JSON.parse(extractJson(content));
  return normalizeSuggestion(parsed, pr);
}

export async function handleSuggestionGenerationRequest(req, res) {
  if (req.method !== 'POST') {
    jsonResponse(res, 405, { error: 'method not allowed' });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const suggestion = await generateSuggestionForPr(body.pr);
    jsonResponse(res, 200, { suggestion });
  } catch (error) {
    const status = error.status && error.status >= 400 && error.status < 600 ? error.status : 500;
    jsonResponse(res, status, {
      error: error.message,
    });
  }
}
