import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, Shield, Zap, Sparkles, Loader2 } from 'lucide-react';
import API from '../utils/api';

const SupportBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: `Hello! I am **FraudShield Assistant**, your autonomous security helpdesk helper. 🛡️\n\nI can help you audit system health, explain ML risk scoring, or check sample credit card setups!`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const addBotMessage = (text) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          sender: 'bot',
          text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 900);
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    setInput('');

    // Add user message
    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        sender: 'user',
        text: userText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    // Handle bot response
    const query = userText.toLowerCase();

    if (query.includes('health') || query.includes('status') || query.includes('database') || query.includes('mongo')) {
      setIsTyping(true);
      try {
        const response = await API.get('/health');
        const dbStatus = response.data?.databaseFallback === 'MONGODB' 
          ? '🟢 Fully Live and Connected to MongoDB Atlas Cloud Cluster' 
          : '⚠️ fallback (In-Memory database Mode)';
        
        addBotMessage(`🔌 **Real-time System Status Audit**:\n\n• **Express API Gateway**: \`ONLINE\` (Healthy)\n• **Database Integration**: ${dbStatus}\n• **Handshake Protocol**: IPv4 Whitelist Override Wholesome\n• **Telegram alert Polling Engine**: \`ACTIVE\``);
      } catch (err) {
        addBotMessage(`⚠️ **System Health Check Diagnostics**:\n\nAPI health check request timed out or returned an error. Local in-memory fallback server is currently handling sessions to prevent dashboard downtime.`);
      }
    } 
    else if (query.includes('card') || query.includes('demo') || query.includes('sample') || query.includes('test')) {
      addBotMessage(`💳 **Simulator Test Cards Directory**:\n\nUse these sample card numbers in the **Transaction Simulator** tab to test specific AI presets:\n\n1. **Low-Risk Preset**: \`4111222233334444\` (Standard Visa card, passes Luhn check)\n2. **Medium-Risk (OTP Trigger)**: \`5555666677778888\` (SMS/OTP validation check)\n3. **High-Risk (Auto Blocked)**: \`378282246310005\` (Declined card history, suspicious IP flag)`);
    }
    else if (query.includes('limit') || query.includes('amount') || query.includes('rule')) {
      addBotMessage(`🛡️ **Customizable Rule Engine**:\n\nGo to the **Rules Config** tab to design logic gates. If a transaction meets your rule condition (e.g. \`Amount > $2,000\`), you can configure the system to:\n\n• **Approve**: Let it complete automatically.\n• **Block**: Terminate the payment instantly.\n• **Review**: Queue it for physical validation or Telegram bot confirmation.`);
    }
    else if (query.includes('otp') || query.includes('code') || query.includes('verify') || query.includes('authentication')) {
      addBotMessage(`🔑 **3D-Secure OTP Security**:\n\nWhen a medium-risk card is simulated, a 6-digit verification code is generated. Customers enter it in the payment form to proceed.\n\n*Pro-tip:* You can inspect or force-approve OTP challenges in real-time from your Telegram Bot helper with the \`/otp\` command!`);
    }
    else if (query.includes('telegram') || query.includes('bot')) {
      addBotMessage(`🤖 **Telegram AI bot Assistant Integration**:\n\nYour Telegram assistant is active under the handle **@fraudshield_alert_bot**.\n\nYou can chat with it to perform remote security commands, such as creating operator dashboard profiles with the \`/credentials\` command!`);
    }
    else {
      addBotMessage(`🤖 **FraudShield AI Assistant Helpdesk**:\n\nI can help you check:\n• "🔌 System Status" or "Health check"\n• "💳 Test cards" for checkout simulation\n• "🛡️ Rules limit" for risk score settings\n• "🔑 OTP checks" for 3D-secure features\n\nIf you have a dedicated technical inquiry, feel free to email our engineering desk at support@fraudshield.ai.`);
    }
  };

  const handleQuickAction = (actionText) => {
    setInput(actionText);
    setTimeout(() => {
      // Small delay to make it feel natural
      const btn = document.getElementById('chat-send-btn');
      if (btn) btn.click();
    }, 100);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* ── Chat Widget Bubble Toggle ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all duration-300 transform hover:scale-105 cursor-pointer animate-bounce-slow"
          title="FraudShield Assistant Helpdesk"
          id="bot-assistant-bubble"
        >
          <Bot className="h-6 w-6 animate-pulse-slow" />
        </button>
      )}

      {/* ── Chat Window ── */}
      {isOpen && (
        <div 
          className="w-80 sm:w-96 h-[500px] bg-[#121824] border border-[#1f293d] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up glow-card"
          id="bot-assistant-drawer"
        >
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-[#0c101c] to-[#0f1754] border-b border-[#1f293d] flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Bot className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <h4 className="text-white text-xs font-bold leading-tight flex items-center space-x-1">
                  <span>FraudShield AI Helpdesk</span>
                  <Sparkles className="h-3 w-3 text-indigo-400" />
                </h4>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse-glow" />
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Assistant Active</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-[#121824]/60 rounded-lg cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {messages.map((m) => {
              const isBot = m.sender === 'bot';
              return (
                <div 
                  key={m.id} 
                  className={`flex ${isBot ? 'justify-start' : 'justify-end'} animate-fade-in`}
                >
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    isBot 
                      ? 'bg-[#0f1225] border border-[#1f293d]/50 text-slate-300' 
                      : 'bg-indigo-600 text-white shadow-md'
                  }`}>
                    {/* Render basic markdown for bold text and list markers */}
                    <div className="whitespace-pre-line font-medium">
                      {m.text.split('\n').map((line, i) => {
                        let content = line;
                        // Replace **text** with bold tags
                        const boldMatches = content.match(/\*\*(.*?)\*\*/g);
                        if (boldMatches) {
                          boldMatches.forEach(match => {
                            const rawText = match.replace(/\*\*/g, '');
                            content = content.replace(match, `<strong>${rawText}</strong>`);
                          });
                        }
                        // Replace `code` with styled span tags
                        const codeMatches = content.match(/`(.*?)`/g);
                        if (codeMatches) {
                          codeMatches.forEach(match => {
                            const rawCode = match.replace(/`/g, '');
                            content = content.replace(match, `<span class="bg-[#121824] px-1.5 py-0.5 rounded border border-[#1f293d]/80 text-indigo-400 font-mono text-[10px]">${rawCode}</span>`);
                          });
                        }
                        return (
                          <p 
                            key={i} 
                            dangerouslySetInnerHTML={{ __html: content }}
                            className={i > 0 ? 'mt-1.5' : ''}
                          />
                        );
                      })}
                    </div>
                    <div className={`text-[9px] mt-1.5 flex justify-end ${
                      isBot ? 'text-slate-500' : 'text-indigo-200'
                    }`}>
                      {m.time}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Simulated typing placeholder */}
            {isTyping && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-[#0f1225] border border-[#1f293d]/50 rounded-2xl px-4 py-3 flex items-center space-x-1.5">
                  <Loader2 className="h-4 w-4 text-indigo-400 animate-spin" />
                  <span className="text-[10px] text-slate-400 font-semibold">Assistant is typing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Option Buttons */}
          <div className="px-4 pb-2 pt-1 border-t border-[#1f293d]/30 bg-[#121824] flex flex-wrap gap-1.5">
            <button 
              onClick={() => handleQuickAction('Check system health status')}
              className="text-[10px] font-bold text-slate-300 bg-[#0f1225] hover:bg-indigo-950/20 border border-[#1f293d] rounded-lg px-2.5 py-1.5 transition-all cursor-pointer flex items-center space-x-1"
            >
              <Zap className="h-3 w-3 text-indigo-400" />
              <span>🔌 Audit Health</span>
            </button>
            <button 
              onClick={() => handleQuickAction('Show demo simulator test cards')}
              className="text-[10px] font-bold text-slate-300 bg-[#0f1225] hover:bg-indigo-950/20 border border-[#1f293d] rounded-lg px-2.5 py-1.5 transition-all cursor-pointer flex items-center space-x-1"
            >
              <Shield className="h-3 w-3 text-indigo-400" />
              <span>💳 Test Cards</span>
            </button>
            <button 
              onClick={() => handleQuickAction('How do AI rules and limits work?')}
              className="text-[10px] font-bold text-slate-300 bg-[#0f1225] hover:bg-indigo-950/20 border border-[#1f293d] rounded-lg px-2.5 py-1.5 transition-all cursor-pointer flex items-center space-x-1"
            >
              <Sparkles className="h-3 w-3 text-indigo-400" />
              <span>🛡️ AI Rules</span>
            </button>
          </div>

          {/* Footer Input */}
          <form 
            onSubmit={handleSend}
            className="p-3 bg-[#0c101c] border-t border-[#1f293d] flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask a custom question..."
              className="flex-1 bg-[#121824] border border-[#1f293d] text-white rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-500"
            />
            <button 
              type="submit"
              id="chat-send-btn"
              disabled={!input.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl p-2.5 transition-all cursor-pointer shadow-md shadow-indigo-600/10 shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* ── Keyframe Animations Injector ── */}
      <style>{`
        @keyframes bounceSlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-slow {
          animation: bounceSlow 3.2s infinite ease-in-out;
        }
        @keyframes pulseSlow {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        .animate-pulse-slow {
          animation: pulseSlow 2.5s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default SupportBot;
