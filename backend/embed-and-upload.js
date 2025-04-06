require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { OpenAI } = require("openai");
const { QdrantClient } = require("@qdrant/js-client-rest");

// 初期化
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY || undefined,
});

// 読み込みデータ
const filePath = path.join(__dirname, "municipalities.json");
const municipalities = JSON.parse(fs.readFileSync(filePath, "utf8"));

// コレクション名
const COLLECTION_NAME = "municipalities";

// メイン処理
(async () => {
  console.log("🚀 ベクトル登録開始...");

  // 1. コレクション作成（なければ）
  const collections = await qdrant.getCollections();
  const exists = collections.collections.some((c) => c.name === COLLECTION_NAME);
  if (!exists) {
    await qdrant.createCollection(COLLECTION_NAME, {
      vectors: {
        size: 1536,
        distance: "Cosine",
      },
    });
    console.log("✅ コレクション作成:", COLLECTION_NAME);
  } else {
    console.log("ℹ️ すでに存在:", COLLECTION_NAME);
  }

  // 2. データごとにベクトル化＆登録
  for (const item of municipalities) {
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: item.features,
    });

    const [embedding] = embeddingResponse.data.map((d) => d.embedding);

    await qdrant.upsert(COLLECTION_NAME, {
      points: [
        {
          id: parseInt(item.id.replace(/\D/g, ""), 10),
          vector: embedding,
          payload: {
            location: item.location,
            features: item.features,
            category: item.category,
          },
        },
      ],
    });

    console.log(`✅ 登録完了: ${item.id} (${item.location})`);
  }

  console.log("🎉 全データ登録完了！");
})();
