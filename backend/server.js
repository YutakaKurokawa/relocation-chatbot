const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ルート追加
app.use("/api/chat", require("./routes/chat"));
app.use("/api/search", require("./routes/search"));
app.use("/api/municipalities", require("./routes/municipalities"));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API Server running at http://localhost:${PORT}`);
});
