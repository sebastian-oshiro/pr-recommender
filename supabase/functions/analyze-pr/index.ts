import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PRData {
  id: string;
  number: number;
  title: string;
  description: string;
  repository: string;
  status: string;
  filesChanged: number;
  additions: number;
  deletions: number;
  labels: string[];
  techStack: string[];
}

interface AnalyzeRequest {
  pr: PRData;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { pr }: AnalyzeRequest = await req.json();

    const groqApiKey = Deno.env.get("GROQ_API_KEY");
    if (!groqApiKey) {
      return new Response(
        JSON.stringify({ error: "Groq APIキーがサーバーに設定されていません" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `あなたは技術ブログのコンテンツ戦略家です。以下のGitHub PRの情報を分析して、日本語の技術ブログ記事のアイデアを1件生成してください。

## PR情報
- タイトル: ${pr.title}
- リポジトリ: ${pr.repository}
- 説明: ${pr.description}
- ステータス: ${pr.status}
- 変更ファイル数: ${pr.filesChanged}
- 追加行数: ${pr.additions}
- 削除行数: ${pr.deletions}
- ラベル: ${pr.labels.join(", ")}
- 技術スタック: ${pr.techStack.join(", ")}

## 出力形式（JSON形式で回答してください）
{
  "title": "ブログ記事タイトル（魅力的で検索されやすいもの）",
  "summary": "2〜3文の概要（読者が得られる価値を明確に）",
  "keyPoints": ["ポイント1", "ポイント2", "ポイント3", "ポイント4"],
  "tags": ["タグ1", "タグ2", "タグ3"],
  "difficulty": "beginner | intermediate | advanced",
  "estimatedReadTime": 読了時間（分、数値のみ）,
  "score": ブログ価値スコア（0-100、技術的な深さ・読者への価値・独自性を考慮）
}

JSONのみ出力してください。説明文は不要です。`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const errMsg = (errBody as { error?: { message?: string } })?.error?.message ?? response.statusText;
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Groq APIのレート制限に達しました。しばらく待ってから再試行してください。" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: "Groq APIキーが無効です。設定画面でAPIキーを確認してください。" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: `Groq APIエラー: ${errMsg}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json() as {
      choices: { message: { content: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "AIからの応答が空です" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(
        JSON.stringify({ error: "AIの応答からJSONを解析できませんでした" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const suggestion = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify({ suggestion }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const rawMessage = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: `予期しないエラー: ${rawMessage}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
