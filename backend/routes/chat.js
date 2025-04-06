const express = require("express");
const router = express.Router();
const { OpenAI } = require("openai");
const dotenv = require("dotenv");

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/", async (req, res) => {
  const { message } = req.body;

  try {
    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-0125",
        messages: [
          {
            role: "system",
            content: `
            あなたは移住支援アドバイザーです。
            ユーザーは自然言語で「どんな地域に移住したいか」をざっくり伝えます。
            あなたの役割は、曖昧な表現があった場合に、1回だけ質問で具体化することです。
            
            🔴 重要なルール：
            - 聞き返しは1回だけにしてください。2回目以降は絶対に行わず、入力内容から判断して次の処理に進めてください。
            - ユーザーが選択肢の一部だけ（例：「A」）と答えた場合も、それを尊重して進めてください。
            - 質問はシンプルかつ優しく、選択肢を提示する形式にしてください。
            
            【出力形式】
            質問文
            A. 選択肢1
            B. 選択肢2
            C. 選択肢3（任意）
            
            【例】
            「自然がきれいなところに住みたい」と言われたら、
            →「どんな自然が好きですか？ A. 森林 B. 草原 C. 湖や川」などの形式で聞き返してください。
            → 次の回答が来たら、それ以上の深掘りはせず、ユーザーの意図を尊重して前に進めてください。
            `
          },
          { role: "user", content: message },
        ],
      });
      

    const reply = response.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error("OpenAI API error:", error.message);
    res.status(500).json({ error: "Chat API failed" });
  }
});

module.exports = router;
