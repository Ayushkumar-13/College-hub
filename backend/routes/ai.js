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
Keep responses concise, friendly, and helpful. You are NOT a general-purpose chatbot — stay focused on college-related topics.`;

/* ------------------------------------------------
   POST /api/ai/chat
   Body: { message: string, history: [{role, parts}] }
   Auth: required
------------------------------------------------- */
router.post("/chat", auth, async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Message is required" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
    });

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: "Context: " + SYSTEM_PROMPT }] },
        { role: "model", parts: [{ text: "Understood. I am CollegeBot." }] },
        ...history.map((h) => ({
          role: h.role,
          parts: [{ text: h.parts }],
        })),
      ],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });
  } catch (err) {
    console.error("❌ Gemini chat error:", err.message);
    res.status(500).json({ error: "AI service error", message: err.message });
  }
});

/* ------------------------------------------------
   POST /api/ai/suggest-post
   Body: { topic: string }
   Auth: required
   Returns a creative post caption/idea
------------------------------------------------- */
router.post("/suggest-post", auth, async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ error: "Topic is required" });

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `You are a creative writing assistant for a college social platform.
Generate a short, engaging post caption (max 3 sentences) for the topic: "${topic}".
Make it relatable to college students. Return only the caption text, no extra commentary.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.json({ suggestion: text.trim() });
  } catch (err) {
    console.error("❌ Gemini suggest-post error:", err.message);
    res.status(500).json({ error: "AI service error", message: err.message });
  }
});

/* ------------------------------------------------
   POST /api/ai/study-help
   Body: { subject: string, question: string }
   Auth: required
------------------------------------------------- */
router.post("/study-help", auth, async (req, res) => {
  try {
    const { subject, question } = req.body;
    if (!subject || !question) {
      return res.status(400).json({ error: "Subject and question are required" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `You are a knowledgeable tutor. A student asks about ${subject}:
"${question}"
Provide a clear, accurate, and student-friendly explanation. Keep it under 300 words.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.json({ answer: text.trim() });
  } catch (err) {
    console.error("❌ Gemini study-help error:", err.message);
    res.status(500).json({ error: "AI service error", message: err.message });
  }
});

module.exports = router;
