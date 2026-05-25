const express = require('express');
const router  = express.Router();

const SYSTEM_PROMPT = `You are the FraudShield AI Assistant — a helpful, friendly, and knowledgeable support bot embedded inside an AI-powered Credit Card Fraud Detection platform called FraudShield.

You can answer:
- ANY general knowledge or random questions the user asks (geography, science, history, math, coding, etc.)
- Questions about fraud detection, cybersecurity, machine learning, and fintech
- Questions about the FraudShield platform (dashboard, transaction simulator, rules config, analytics, support)

Platform context:
- FraudShield is a real-time credit card fraud detection SaaS platform
- It uses ML models that score transactions in <50ms with 99.97% accuracy
- Features: Transaction Simulator, Rules Config, ML Analytics, Manual Review Queue, Security Profile
- It is SOC 2, PCI DSS, and GDPR compliant
- It uses AES-256 encryption and TLS 1.3

Be concise, clear, and friendly. Use bullet points when listing. Use emojis sparingly but naturally.
If the question is unrelated to the platform, answer it helpfully anyway — you are a general-purpose AI assistant too.`;

/**
 * POST /api/chat
 * Body: { message: string, history: [{role: 'user'|'model', text: string}] }
 */
router.post('/', async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, reply: 'Message is required.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Fallback: smart keyword responses if no API key configured
    return res.status(200).json({ success: true, reply: getFallbackReply(message) });
  }

  try {
    // Build conversation history for Gemini
    const contents = [];

    // Add history (last 10 turns to stay within token limits)
    const recentHistory = history.slice(-10);
    for (const h of recentHistory) {
      contents.push({ role: h.role, parts: [{ text: h.text }] });
    }
    // Add current user message
    contents.push({ role: 'user', parts: [{ text: message }] });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const payload = {
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512,
        topP: 0.9,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      ],
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', response.status, errText);
      return res.status(200).json({ success: true, reply: getFallbackReply(message) });
    }

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return res.status(200).json({ success: true, reply: getFallbackReply(message) });
    }

    return res.status(200).json({ success: true, reply: reply.trim() });
  } catch (err) {
    console.error('Chat route error:', err.message);
    return res.status(200).json({ success: true, reply: getFallbackReply(message) });
  }
});

/* Keyword fallback (used when no API key is set) */
function getFallbackReply(message) {
  const q = message.toLowerCase();
  if (q.includes('health') || q.includes('status') || q.includes('server')) {
    return '🔌 System Status: API is **ONLINE**. Use the "Audit Health" button for a live database check.';
  }
  if (q.includes('card') || q.includes('test') || q.includes('demo')) {
    return '💳 Test Cards:\n• Low-risk: `4111222233334444`\n• Medium-risk: `5555666677778888`\n• High-risk (blocked): `378282246310005`';
  }
  if (q.includes('rule') || q.includes('limit') || q.includes('amount')) {
    return '🛡️ Go to **Rules Config** tab to set amount limits, block conditions, or trigger reviews automatically.';
  }
  if (q.includes('fraud') || q.includes('detect')) {
    return '🤖 FraudShield uses ML models scoring transactions in <50ms with 99.97% accuracy using 1000+ risk signals.';
  }
  return `I received your message: "${message}"\n\n⚠️ AI responses are temporarily unavailable. Please configure **GEMINI_API_KEY** in Vercel environment variables for full AI chat support.`;
}

module.exports = router;
