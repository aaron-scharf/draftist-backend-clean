import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* =========================
   Health Check
========================= */
app.get("/test", (req, res) => {
  res.json({ message: "Server works" });
});

/* =========================
   Generate Reply
========================= */
app.post("/generate", async (req, res) => {
  try {
    console.log("BODY RECEIVED:", req.body);

    const { emailText, length, formality } = req.body;

    if (!emailText) {
      return res.status(400).json({ error: "No email text provided." });
    }

    const prompt = `
Write a reply to this email:

"${emailText}"

Length level (1-5): ${length}
Formality level (1-5): ${formality}

Rules:
- Keep it natural
- Be concise
- Do NOT over-explain
- Match requested formality
`;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
      max_output_tokens: 200,
    });

    const reply = response.output_text;

    if (!reply) {
      console.log("No reply returned from OpenAI");
      return res.status(500).json({ error: "No reply returned." });
    }

    console.log("AI REPLY:", reply);

    res.json({ reply });

  } catch (error) {
    console.error("OPENAI ERROR:", error);

    res.status(500).json({
      error: "AI generation failed.",
      details: error.message
    });
  }
});

/* =========================
   Start Server
========================= */
app.listen(3000, () => {
  console.log("Draftist backend running at http://localhost:3000");
});
