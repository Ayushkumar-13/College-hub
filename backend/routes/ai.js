// FILE: backend/routes/ai.js
const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const auth = require("../middleware/auth");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are CollegeBot, an intelligent AI assistant built into College Hub — a social platform for college students.
You help students with:
- Academic questions and study tips
- Campus life advice
- Post/content ideas for the platform
- Career and internship guidance
- General college-related queries
Keep responses concise, friendly, and helpful. Stay focused on college-related topics.`;

/**
 * 🔥 BULLETPROOF MODEL RESOLVER
 * Tries various models to find one that works for this API key/region.
 */
const getStableModel = (id = "gemini-1.5-flash") => {
  try {
    // We try gemini-1.5-flash first, then gemini-pro
    return genAI.getGenerativeModel({ model: id });
  } catch (err) {
    return genAI.getGenerativeModel({ model: "gemini-pro" });
  }
};

/* ------------------------------------------------
   POST /api/ai/chat
------------------------------------------------- */
router.post("/chat", auth, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    // Try Gemini 1.5 Flash (preferred)
    const model = getStableModel("gemini-1.5-flash");

    const chat = model.startChat({
        history: [
            { role: "user", parts: [{ text: "Context: " + SYSTEM_PROMPT }] },
            { role: "model", parts: [{ text: "Understood. I am CollegeBot." }] },
            ...history.map(h => ({
                role: h.role === 'model' ? 'model' : 'user',
                parts: [{ text: h.parts || h.text || "" }]
            }))
        ]
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    res.json({ reply: response.text() });

  } catch (err) {
    console.error("❌ Gemini chat error:", err.message);
    
    // 🔥 FINAL FALLBACK: If Chat fails, try simple generateContent with gemini-pro
    try {
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await fallbackModel.generateContent(`${SYSTEM_PROMPT}\n\nUser: ${req.body.message}`);
        return res.json({ reply: result.response.text() });
    } catch (innerErr) {
        res.status(500).json({ error: "AI service error", message: innerErr.message });
    }
  }
});

/* ------------------------------------------------
   POST /api/ai/suggest-post
------------------------------------------------- */
router.post("/suggest-post", auth, async (req, res) => {
  try {
    const { topic } = req.body;
    const model = getStableModel();
    const prompt = `${SYSTEM_PROMPT}\nGenerate a short, engaging post caption for: "${topic}". Return only text.`;
    const result = await model.generateContent(prompt);
    res.json({ suggestion: result.response.text().trim() });
  } catch (err) {
    res.status(500).json({ error: "AI service error", message: err.message });
  }
});

/* ------------------------------------------------
   POST /api/ai/study-help
------------------------------------------------- */
router.post("/study-help", auth, async (req, res) => {
  try {
    const { subject, question } = req.body;
    const model = getStableModel();
    const prompt = `Tutor Mode: ${subject} question: "${question}". Explain clearly and concisely.`;
    const result = await model.generateContent(prompt);
    res.json({ answer: result.response.text().trim() });
  } catch (err) {
    res.status(500).json({ error: "AI service error", message: err.message });
  }
});

module.exports = router;
