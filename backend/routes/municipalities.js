const express = require("express");
const router = express.Router();

router.get("/:id", (req, res) => {
  const { id } = req.params;

  if (id === "municipality_123") {
    res.json({
      id,
      name: "四万十町",
      prefecture: "高知県",
      population: 15000,
      features: {
        housing: [
          {
            title: "空き家改修費補助",
            description: "最大100万円の補助金が利用可能",
            url: "https://www.town.shimanto.lg.jp/iju/housing",
          },
        ],
      },
    });
  } else {
    res.status(404).json({ error: "Not found" });
  }
});

module.exports = router;
