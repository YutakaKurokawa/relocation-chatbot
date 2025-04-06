// test-connections.js

require("dotenv").config();
const { createClient } = require("redis");
const { QdrantClient } = require("@qdrant/js-client-rest");

(async () => {
  console.log("🔄 接続テスト開始...\n");

  // Redis 接続
  const redis = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379"
  });

  try {
    await redis.connect();
    await redis.set("test-key", "hello");
    const value = await redis.get("test-key");
    console.log("✅ Redis接続成功！ test-key =", value);
    await redis.quit();
  } catch (e) {
    console.error("❌ Redis接続失敗:", e.message);
  }

  // Qdrant 接続
  const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL || "http://localhost:6333"
  });

  try {
    const collections = await qdrant.getCollections();
    console.log("✅ Qdrant接続成功！コレクション一覧:", collections);
  } catch (e) {
    console.error("❌ Qdrant接続失敗:", e.message);
  }

  console.log("\n🎉 テスト完了！");
})();
