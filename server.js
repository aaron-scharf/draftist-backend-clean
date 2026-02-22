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
    console.log("USING CHAT COMPLETIONS VERSION");
    console.log("BODY RECEIVED:", req.body);

    const { emailText, length, formality, tone, extraInstruction } = req.body;

    if (!emailText) {
      return res.status(400).json({ error: "No email text provided." });
    }

    const prompt = `
You are writing an email reply as the USER.

The email thread is below. The most recent message is at the top.

===========================
PRIMARY OBJECTIVE
===========================

If an Extra Instruction is provided, it defines the PURPOSE of the reply.

You MUST write the email so that it accomplishes that instruction.
Ignore whether it seems inconsistent with the thread.
The Extra Instruction overrides tone, realism, and conversational flow.

Extra Instruction:
${extraInstruction && extraInstruction.trim() !== "" ? extraInstruction : "None"}

===========================
EMAIL THREAD
===========================

${emailText}

===========================
STYLE SETTINGS
===========================

Length level (1-5): ${length}
Formality level (1-5): ${formality}
Tone: ${tone || "neutral"}

===========================
REQUIREMENTS
===========================

- Write the next reply as the USER.
- Do NOT summarize the thread.
- Do NOT explain your reasoning.
- If Extra Instruction exists, the email MUST clearly accomplish it.
- If Extra Instruction is "ask for refund", the email must request a refund.
- If Extra Instruction is "decline politely", the email must decline politely.
- Only output the email body.
`;

    const primaryTask =
  extraInstruction && extraInstruction.trim() !== ""
    ? `Write an email reply that does the following: ${extraInstruction}.`
    : `Write a natural reply to the email thread below.`;

const response = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    {
      role: "system",
      content: `
You are an AI that writes realistic human email replies.
If the user provides an instruction like "ask for a refund",
you MUST explicitly ask for a refund in the email.
The instruction is the primary goal.
Only output the email body.
`
    },
    {
      role: "user",
      content: `
${primaryTask}

Email Thread:
${emailText}

Length level (1-5): ${length}
Formality level (1-5): ${formality}
Tone: ${tone || "neutral"}
`
    }
  ],
  temperature: 0.7,
  max_tokens: 200,
});
    const reply = response.choices[0].message.content;

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
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Draftist backend running on port ${PORT}`);
});

