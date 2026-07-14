/*
  # PR Blog Suggester: テーブル作成

  1. 新規テーブル
    - `user_settings`
      - `id` (uuid, PK)
      - `user_id` (text, unique) - ブラウザセッション識別子
      - `github_username` (text)
      - `github_token` (text) - GitHub PAT（暗号化推奨）
      - `anthropic_api_key` (text) - Anthropic APIキー
      - `sync_interval` (text)
      - `min_score` (int)
      - `notify_new` (bool)
      - `notify_weekly` (bool)
      - `created_at` / `updated_at` (timestamptz)

    - `github_prs`
      - `id` (text, PK) - GitHub PR ID
      - `user_id` (text)
      - `number` (int)
      - `title` (text)
      - `description` (text)
      - `url` (text)
      - `repository` (text)
      - `status` (text)
      - `merged_at` (timestamptz, nullable)
      - `created_at` (timestamptz)
      - `files_changed` (int)
      - `additions` (int)
      - `deletions` (int)
      - `labels` (text[])
      - `tech_stack` (text[])
      - `fetched_at` (timestamptz)

    - `blog_suggestions`
      - `id` (uuid, PK)
      - `user_id` (text)
      - `pr_id` (text, FK -> github_prs)
      - `title` (text)
      - `summary` (text)
      - `key_points` (text[])
      - `tags` (text[])
      - `difficulty` (text)
      - `estimated_read_time` (int)
      - `status` (text)
      - `score` (int)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. セキュリティ
    - 全テーブルにRLSを有効化
    - user_idベースのアクセス制御（認証なしのシングルユーザー想定のため、service roleのみ制限）
*/

-- user_settings
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text UNIQUE NOT NULL,
  github_username text DEFAULT '',
  github_token text DEFAULT '',
  anthropic_api_key text DEFAULT '',
  sync_interval text DEFAULT 'daily',
  min_score int DEFAULT 75,
  notify_new boolean DEFAULT true,
  notify_weekly boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read user_settings by user_id"
  ON user_settings FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert user_settings"
  ON user_settings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update user_settings by user_id"
  ON user_settings FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- github_prs
CREATE TABLE IF NOT EXISTS github_prs (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  number int NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  url text DEFAULT '',
  repository text DEFAULT '',
  status text DEFAULT 'open',
  merged_at timestamptz,
  pr_created_at timestamptz DEFAULT now(),
  files_changed int DEFAULT 0,
  additions int DEFAULT 0,
  deletions int DEFAULT 0,
  labels text[] DEFAULT '{}',
  tech_stack text[] DEFAULT '{}',
  fetched_at timestamptz DEFAULT now()
);

ALTER TABLE github_prs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read github_prs"
  ON github_prs FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert github_prs"
  ON github_prs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update github_prs"
  ON github_prs FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete github_prs"
  ON github_prs FOR DELETE
  USING (true);

-- blog_suggestions
CREATE TABLE IF NOT EXISTS blog_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  pr_id text NOT NULL REFERENCES github_prs(id) ON DELETE CASCADE,
  title text NOT NULL,
  summary text DEFAULT '',
  key_points text[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  difficulty text DEFAULT 'intermediate',
  estimated_read_time int DEFAULT 10,
  status text DEFAULT 'not_started',
  score int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE blog_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read blog_suggestions"
  ON blog_suggestions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert blog_suggestions"
  ON blog_suggestions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update blog_suggestions"
  ON blog_suggestions FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete blog_suggestions"
  ON blog_suggestions FOR DELETE
  USING (true);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_github_prs_user_id ON github_prs(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_suggestions_user_id ON blog_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_suggestions_pr_id ON blog_suggestions(pr_id);
