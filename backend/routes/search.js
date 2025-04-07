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

// 結果キャッシュ用のメモリキャッシュ
const searchCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5分間キャッシュを保持

// キャッシュキーの生成
function generateCacheKey(filters, chatSummary) {
  return JSON.stringify({
    filters,
    priorityCategory: chatSummary.priorityCategory,
    details: chatSummary.details,
  });
}

// 簡易的なマッチング理由生成（LLM不使用）
function generateSimpleMatchReason(recommendation, chatSummary, filterText) {
  const category = recommendation.category;
  const score = recommendation.match_score;
  let reason = "";
  
  if (score > 0.8) {
    reason = `${recommendation.location}は${category}が充実しており、あなたの希望条件に非常に適しています。`;
  } else if (score > 0.7) {
    reason = `${recommendation.location}は${category}の面で優れており、あなたの条件に合致しています。`;
  } else {
    reason = `${recommendation.location}は${category}の特徴があり、あなたの希望に沿った選択肢です。`;
  }
  
  return reason;
}

// /api/search POSTエンドポイント
router.post("/", async (req, res) => {
  // パフォーマンス計測開始
  const startTime = performance.now();
  console.log("🔍 検索処理開始");
  
  const { filters, chatSummary } = req.body;

  const filterText = convertFilters(filters);
  const queryText = `
優先カテゴリ：${chatSummary.priorityCategory}
詳細希望：${chatSummary.details}
条件フィルター：${filterText}
`;

  // キャッシュキーの生成
  const cacheKey = generateCacheKey(filters, chatSummary);
  
  // キャッシュチェック
  if (searchCache.has(cacheKey)) {
    const cachedData = searchCache.get(cacheKey);
    if (Date.now() - cachedData.timestamp < CACHE_TTL) {
      console.log("🔄 キャッシュから結果を返却");
      const endTime = performance.now();
      console.log(`⏱️ 検索処理完了: ${(endTime - startTime).toFixed(2)}ms (キャッシュヒット)`);
      return res.json({ recommendations: cachedData.data });
    } else {
      // TTL切れの場合はキャッシュを削除
      searchCache.delete(cacheKey);
    }
  }

  try {
    // 1. ベクトル化と検索を並列実行
    console.log("📊 埋め込み生成開始");
    const embeddingStartTime = performance.now();
    const embeddingPromise = openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: queryText,
    });
    
    // 埋め込みの生成を待つ
    const embeddingResponse = await embeddingPromise;
    const embeddingEndTime = performance.now();
    console.log(`📊 埋め込み生成完了: ${(embeddingEndTime - embeddingStartTime).toFixed(2)}ms`);
    
    const [embedding] = embeddingResponse.data.map((d) => d.embedding);

    // 2. Qdrant検索（AND条件フィルター付き）
    console.log("🔎 Qdrant検索開始");
    const qdrantStartTime = performance.now();
    const searchResults = await qdrant.search("municipalities", {
      vector: embedding,
      limit: 5,
      with_payload: true,
      filter: buildQdrantFilter(filters),
    });
    const qdrantEndTime = performance.now();
    console.log(`🔎 Qdrant検索完了: ${(qdrantEndTime - qdrantStartTime).toFixed(2)}ms`);

    // 3. 検索結果を整形
    const recommendations = searchResults.map((r) => ({
      id: r.id,
      location: r.payload.location,
      features: r.payload.features.split("。").filter(Boolean),
      category: r.payload.category,
      match_score: r.score,
      source_url: r.payload.source_url || `https://www.google.com/search?q=${encodeURIComponent(r.payload.location + " 移住支援")}`, // 公式サイトURLがない場合はGoogle検索URLを生成
    }));

    if (recommendations.length === 0) {
      return res.json({ recommendations: [] });
    }

    // 4. LLMを使わず簡易的なマッチング理由を生成
    const enriched = recommendations.map((rec) => ({
      ...rec,
      match_reason: generateSimpleMatchReason(rec, chatSummary, filterText)
    }));

    // 結果をキャッシュに保存
    searchCache.set(cacheKey, {
      data: enriched,
      timestamp: Date.now()
    });

    const endTime = performance.now();
    console.log(`⏱️ 検索処理完了: ${(endTime - startTime).toFixed(2)}ms (キャッシュミス)`);
    
    res.json({ recommendations: enriched });
  } catch (err) {
    console.error("❌ /api/search with reasoning エラー:", err);
    res.status(500).json({ error: "検索・理由生成に失敗しました" });
  }
});

module.exports = router;
