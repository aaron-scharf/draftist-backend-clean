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
    console.log("USING STRICT CONTROLLED VERSION");
    console.log("BODY RECEIVED:", req.body);

    const { emailText, length = 3, formality = 3, tone = "neutral", extraInstruction } = req.body;

    if (!emailText) {
      return res.status(400).json({ error: "No email text provided." });
    }

    /* =========================
       STYLE GUIDES
    ========================= */

    const lengthGuide = {
      1: "Extremely short. 1–2 sentences maximum.",
      2: "Short. 2–3 sentences.",
      3: "Medium length. One short paragraph.",
      4: "Long. Multiple paragraphs with explanation.",
      5: "Very detailed and comprehensive reply."
    };

    const formalityGuide = {
      1: "Very casual. Relaxed and informal.",
      2: "Casual but polite.",
      3: "Neutral professional.",
      4: "Professional and structured.",
      5: "Highly formal and polished."
    };

    const primaryObjective =
      extraInstruction && extraInstruction.trim() !== ""
        ? extraInstruction
        : "Reply naturally to the email thread above.";

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
      max_tokens: length >= 4 ? 450 : 200,
      messages: [
        {
          role: "system",
          content: `
You are a highly controlled AI email writer.

CRITICAL RULES:
- Output ONLY the email body.
- DO NOT include a subject line.
- DO NOT write "Subject:".
- Do NOT summarize the thread.
- Do NOT explain your reasoning.
- The PRIMARY OBJECTIVE must be clearly fulfilled.
- The extra instruction overrides everything.
`
        },
        {
          role: "user",
          content: `
EMAIL THREAD:
${emailText}

PRIMARY OBJECTIVE:
${primaryObjective}

STYLE REQUIREMENTS:

Length Level (${length}):
${lengthGuide[length]}

Formality Level (${formality}):
${formalityGuide[formality]}

Tone:
${tone}

Write the reply now.
`
        }
      ]
    });

    let reply = response.choices[0].message.content;

    if (!reply) {
      console.log("No reply returned from OpenAI");
      return res.status(500).json({ error: "No reply returned." });
    }

    // Extra safety: remove subject lines if model ignores instruction
    reply = reply.replace(/subject:.*\n?/gi, "").trim();

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
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Draftist backend running on port ${PORT}`);
});