// FILE: backend/routes/ai.js
const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const auth = require("../middleware/auth");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are CollegeBot, a friendly AI assistant for College Hub.
Help students with academics, campus life, career tips, and post ideas.
Stay concise and focused on college topics.`;

/**
 * 🔥 ULTIMATE MODEL RESOLVER
 * Cycles through every possible model name until one responds.
 */
const tryModels = async (prompt, res) => {
  const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro", "gemini-1.0-pro"];
  
  for (const modelName of models) {
    try {
      console.log(`🤖 Attempting AI with model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1' });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      if (text) {
        console.log(`✅ AI Success with model: ${modelName}`);
        return res.json({ reply: text, suggestion: text, answer: text });
      }
    } catch (err) {
      console.warn(`⚠️ Model ${modelName} failed:`, err.message);
      continue; // Try next model
    }
  }
  
  throw new Error("All AI models failed. Please check your GEMINI_API_KEY or region availability.");
};

/* ------------------------------------------------
   POST /api/ai/chat
------------------------------------------------- */
router.post("/chat", auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const fullPrompt = `${SYSTEM_PROMPT}\n\nUser Question: ${message}\nResponse:`;
    await tryModels(fullPrompt, res);

  } catch (err) {
    console.error("❌ Final AI Failure:", err.message);
    res.status(500).json({ error: "AI service unavailable", message: err.message });
  }
});

/* ------------------------------------------------
   POST /api/ai/suggest-post
------------------------------------------------- */
router.post("/suggest-post", auth, async (req, res) => {
  try {
    const { topic } = req.body;
    const prompt = `Post Idea Generator: Generate a short, creative college post caption for "${topic}". Just the text.`;
    await tryModels(prompt, res);
  } catch (err) {
    res.status(500).json({ error: "AI service unavailable", message: err.message });
  }
});

/* ------------------------------------------------
   POST /api/ai/study-help
------------------------------------------------- */
router.post("/study-help", auth, async (req, res) => {
  try {
    const { subject, question } = req.body;
    const prompt = `Study Tutor: Subject ${subject}. Question: ${question}. Provide a simple, clear explanation.`;
    await tryModels(prompt, res);
  } catch (err) {
    res.status(500).json({ error: "AI service unavailable", message: err.message });
  }
});

module.exports = router;
