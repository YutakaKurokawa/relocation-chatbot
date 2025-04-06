// routes/search.js

const express = require("express");
const router = express.Router();
const { OpenAI } = require("openai");
const { QdrantClient } = require("@qdrant/js-client-rest");
require("dotenv").config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY || undefined,
});

// 条件フィルターを自然文に変換
function convertFilters(filters) {
  const map = {
    housing: "住居支援",
    childcare: "子育て支援",
    telework: "テレワーク",
    climate: "温暖な気候",
    medicalTransport: "医療や交通の利便性",
    community: "地域コミュニティとの関わり"
  };

  return Object.entries(filters)
    .filter(([_, v]) => v > 0)
    .map(([k, v]) => `${map[k]}を${v === 2 ? "重視" : "少し重視"}`)
    .join("、");
}

// QdrantのAND検索フィルター生成
function buildQdrantFilter(filters) {
  const categoryMap = {
    housing: "住居支援",
    childcare: "子育て支援",
    telework: "テレワーク",
    climate: "温暖な気候",
    medicalTransport: "医療や交通の利便性",
    community: "地域コミュニティとの関わり"
  };

  const must = Object.entries(filters)
    .filter(([_, v]) => v === 2)
    .map(([k, _]) => ({
      key: "category",
      match: { value: categoryMap[k] }
    }));

  return must.length > 0 ? { must } : undefined;
}

// /api/search POSTエンドポイント
router.post("/", async (req, res) => {
  const { filters, chatSummary } = req.body;

  const filterText = convertFilters(filters);
  const queryText = `
優先カテゴリ：${chatSummary.priorityCategory}
詳細希望：${chatSummary.details}
条件フィルター：${filterText}
`;

  try {
    // 1. ベクトル化
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: queryText,
    });
    const [embedding] = embeddingResponse.data.map((d) => d.embedding);

    // 2. Qdrant検索（AND条件フィルター付き）
    const searchResults = await qdrant.search("municipalities", {
      vector: embedding,
      limit: 5,
      with_payload: true,
      filter: buildQdrantFilter(filters),
    });

    // 3. 検索結果を整形
    const recommendations = searchResults.map((r) => ({
      id: r.id,
      location: r.payload.location,
      features: r.payload.features.split("。").filter(Boolean),
      category: r.payload.category,
      match_score: r.score,
    }));

    if (recommendations.length === 0) {
      return res.json({ recommendations: [] });
    }

    // 4. LLMにmatch_reasonを生成させる
    const prompt = `
あなたは移住支援の専門家です。以下のユーザー希望に対して、推薦された各自治体がなぜマッチしているのかを1〜2文で説明してください。

【ユーザー希望】
- 優先カテゴリ: ${chatSummary.priorityCategory}
- 詳細: ${chatSummary.details}
- 条件フィルター: ${filterText}

【推薦された自治体】
${JSON.stringify(recommendations)}

【出力形式】
{
  "reasons": [
    { "id": 1, "match_reason": "〇〇だからユーザーの希望に合致しています。" },
    ...
  ]
}
`;

    const reasoningResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0125",
      messages: [
        { role: "system", content: "出力は必ずJSON形式でお願いします。" },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    let reasons = [];
    try {
      reasons = JSON.parse(reasoningResponse.choices[0].message.content).reasons;
    } catch (e) {
      console.error("❌ GPT JSONパースエラー:", e.message);
      return res.status(500).json({ error: "match_reason の生成に失敗しました" });
    }

    // 5. match_reasonをマージ
    const enriched = recommendations.map((rec) => {
      const found = reasons.find((r) => String(r.id) === String(rec.id));
      return {
        ...rec,
        match_reason: found?.match_reason || "理由なし"
      };
    });

    res.json({ recommendations: enriched });
  } catch (err) {
    console.error("❌ /api/search with reasoning エラー:", err);
    res.status(500).json({ error: "検索・理由生成に失敗しました" });
  }
});

module.exports = router;