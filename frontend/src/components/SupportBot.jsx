import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, Shield, Zap, Sparkles, Loader2 } from 'lucide-react';

const QUICK_ACTIONS = [
  { label: '🔌 System Health', message: 'Check system health status' },
  { label: '💳 Test Cards',   message: 'Show demo test card numbers' },
  { label: '🛡️ AI Rules',    message: 'How do AI fraud rules work?' },
  { label: '📊 Analytics',   message: 'Explain ML model performance metrics' },
];

const SupportBot = () => {
  const [isOpen, setIsOpen]     = useState(false);
  const [input, setInput]       = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1, sender: 'bot',
      text: 'Hello! I\'m **FraudShield AI Assistant** 🛡️\n\nI can help with fraud detection, platform features, or answer *any* question you have — finance, tech, science, anything!\n\nWhat would you like to know?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);

  // Conversation history for context-aware responses
  const [history, setHistory] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const pushMessage = (sender, text) => {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      sender, text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
  };

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

  /* Build message array for AI calls */
  const buildMessages = (userText) => {
    const msgs = [{ role: 'system', content: SYSTEM_PROMPT }];
    for (const h of history.slice(-10)) {
      msgs.push({ role: h.role === 'model' ? 'assistant' : 'user', content: h.text });
    }
    msgs.push({ role: 'user', content: userText });
    return msgs;
  };

  const callAI = async (userText) => {
    setIsTyping(true);

    // ── PRIMARY: Pollinations.ai — 100% free, zero API key needed ──
    try {
      const res = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: buildMessages(userText),
          model: 'openai',
          seed: 42,
          jsonMode: false,
        }),
      });
      if (res.ok) {
        const reply = await res.text();
        if (reply && reply.trim()) {
          setIsTyping(false);
          pushMessage('bot', reply.trim());
          setHistory(prev => [
            ...prev,
            { role: 'user',  text: userText },
            { role: 'model', text: reply.trim() },
          ].slice(-20));
          return;
        }
      }
    } catch (err) {
      console.warn('Pollinations failed, trying Gemini…', err.message);
    }

    // ── OPTIONAL UPGRADE: Gemini (if VITE_GEMINI_API_KEY is set) ──
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const contents = [];
        for (const h of history.slice(-10)) {
          contents.push({ role: h.role, parts: [{ text: h.text }] });
        }
        contents.push({ role: 'user', parts: [{ text: userText }] });
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents,
            generationConfig: { temperature: 0.7, maxOutputTokens: 512, topP: 0.9 },
          }),
        });
        const data = await res.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) {
          setIsTyping(false);
          pushMessage('bot', reply.trim());
          setHistory(prev => [
            ...prev,
            { role: 'user',  text: userText },
            { role: 'model', text: reply.trim() },
          ].slice(-20));
          return;
        }
      } catch (err) {
        console.warn('Gemini failed:', err.message);
      }
    }

    // ── LAST RESORT: Backend /api/chat ──
    try {
      const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
      const res  = await fetch(`${base}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, history }),
      });
      const data = await res.json();
      const reply = data?.reply || 'Sorry, I couldn\'t process that. Please try again.';
      setIsTyping(false);
      pushMessage('bot', reply);
      setHistory(prev => [
        ...prev,
        { role: 'user',  text: userText },
        { role: 'model', text: reply },
      ].slice(-20));
    } catch {
      setIsTyping(false);
      pushMessage('bot', '⚠️ Connection error. Please check your network and try again.');
    }
  };

  const handleSend = async (text) => {
    const msg = (text || input).trim();
    if (!msg || isTyping) return;
    setInput('');
    pushMessage('user', msg);
    await callAI(msg);
  };

  const handleQuick = (message) => handleSend(message);

  /* ── Render markdown-like text (bold, code, bullet) ── */
  const renderText = (text) => {
    return text.split('\n').map((line, i) => {
      let html = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g,     '<em>$1</em>')
        .replace(/`(.*?)`/g,       '<code class="bot-code">$1</code>');
      return <p key={i} dangerouslySetInnerHTML={{ __html: html || '&nbsp;' }}
        className={i > 0 ? 'mt-1' : ''} />;
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @keyframes botBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scaleIn   { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
        .bot-bounce { animation: botBounce 3s ease-in-out infinite; }
        .bot-fade   { animation: fadeUp .25s ease both; }
        .bot-scale  { animation: scaleIn .2s ease both; }
        .bot-code {
          background: rgba(99,102,241,0.15); color: #a5b4fc;
          padding: 1px 5px; border-radius: 4px; font-family: monospace; font-size: 10px;
          border: 1px solid rgba(99,102,241,0.25);
        }
        .bot-scroll::-webkit-scrollbar { width: 3px; }
        .bot-scroll::-webkit-scrollbar-track { background: transparent; }
        .bot-scroll::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
      `}</style>

      {/* ── Bubble ── */}
      {!isOpen && (
        <button onClick={() => setIsOpen(true)}
          className="bot-bounce w-14 h-14 rounded-full text-white flex items-center justify-center shadow-lg cursor-pointer"
          style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 8px 24px rgba(79,70,229,0.4)' }}
          title="FraudShield AI Assistant">
          <Bot className="h-6 w-6" />
        </button>
      )}

      {/* ── Chat Window ── */}
      {isOpen && (
        <div className="bot-scale flex flex-col rounded-2xl overflow-hidden shadow-2xl"
          style={{ width: '360px', height: '520px', background: '#0f1117', border: '1px solid rgba(99,102,241,0.2)' }}>

          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg,#0c0f1f,#131736)', borderBottom: '1px solid rgba(99,102,241,0.15)', padding: '14px 16px' }}
            className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
                <Bot className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-white text-xs font-bold">FraudShield AI</span>
                  <Sparkles className="h-3 w-3 text-indigo-400" />
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full" style={{ boxShadow: '0 0 6px #34d399' }} />
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Powered by Gemini</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-white transition-colors p-1.5 rounded-lg cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="bot-scroll flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map(m => {
              const isBot = m.sender === 'bot';
              return (
                <div key={m.id} className={`bot-fade flex ${isBot ? 'justify-start' : 'justify-end'}`}>
                  <div className="max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed"
                    style={isBot
                      ? { background: '#161b2e', border: '1px solid rgba(99,102,241,0.15)', color: '#cbd5e1' }
                      : { background: 'linear-gradient(135deg,#4f46e5,#6d28d9)', color: '#fff', boxShadow: '0 4px 12px rgba(79,70,229,0.3)' }
                    }>
                    <div className="font-medium space-y-0.5">{renderText(m.text)}</div>
                    <div className="text-[9px] mt-1.5 text-right" style={{ color: isBot ? '#475569' : 'rgba(255,255,255,0.5)' }}>
                      {m.time}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {isTyping && (
              <div className="bot-fade flex justify-start">
                <div className="rounded-2xl px-4 py-3 flex items-center gap-2"
                  style={{ background: '#161b2e', border: '1px solid rgba(99,102,241,0.15)' }}>
                  <Loader2 className="h-3.5 w-3.5 text-indigo-400 animate-spin" />
                  <span className="text-[11px] text-slate-400 font-medium">AI is thinking…</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions */}
          <div className="px-3 py-2 flex flex-wrap gap-1.5 shrink-0"
            style={{ borderTop: '1px solid rgba(99,102,241,0.1)', background: '#0c0f1f' }}>
            {QUICK_ACTIONS.map((a, i) => (
              <button key={i} onClick={() => handleQuick(a.message)} disabled={isTyping}
                className="text-[10px] font-semibold rounded-lg px-2.5 py-1.5 transition-all cursor-pointer disabled:opacity-40"
                style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)', color: '#a5b4fc' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.18)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}>
                {a.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={e => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2 p-3 shrink-0"
            style={{ background: '#080b14', borderTop: '1px solid rgba(99,102,241,0.1)' }}>
            <input ref={inputRef} type="text" value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask me anything…"
              disabled={isTyping}
              className="flex-1 text-xs text-white rounded-xl px-3 py-2.5 outline-none transition-all disabled:opacity-50"
              style={{
                background: '#161b2e', border: '1px solid rgba(99,102,241,0.2)',
                caretColor: '#818cf8',
              }}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = 'rgba(99,102,241,0.2)'}
            />
            <button type="submit" disabled={!input.trim() || isTyping}
              className="rounded-xl p-2.5 transition-all cursor-pointer disabled:opacity-30 shrink-0"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#6d28d9)', boxShadow: '0 4px 12px rgba(79,70,229,0.3)' }}>
              <Send className="h-3.5 w-3.5 text-white" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default SupportBot;
