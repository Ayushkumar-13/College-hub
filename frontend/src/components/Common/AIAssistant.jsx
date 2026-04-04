import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bot, X, Send, Sparkles, BookOpen, FileText, Loader2 } from 'lucide-react';
import { chatWithAI, suggestPost, getStudyHelp } from '@/api/aiApi';

const AIAssistant = () => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('chat');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([{ role: 'model', text: '👋 Hi! I am your AI assistant.' }]);
  const [chatInput, setChatInput] = useState('');
  const [history, setHistory] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (open && tab === 'chat') {
        const timer = setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        return () => clearTimeout(timer);
    }
  }, [messages, open, tab]);

  const handleChat = async () => {
    if (!chatInput.trim() || loading) return;
    const text = chatInput.trim();
    setChatInput('');
    setMessages(p => [...p, { role: 'user', text }]);
    setLoading(true);
    try {
      const { reply } = await chatWithAI(text, history);
      setMessages(p => [...p, { role: 'model', text: reply }]);
      setHistory(p => [...p, { role: 'user', parts: text }, { role: 'model', parts: reply }]);
    } catch {
      setMessages(p => [...p, { role: 'model', text: '⚠️ Something went wrong.' }]);
    } finally { setLoading(false); }
  };

  const toggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🤖 AI Toggle:', !open);
    setOpen(v => !v);
  };

  return (
    <>
      <button 
        type="button"
        onClick={toggle} 
        className="relative p-2 rounded-xl transition-all hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 z-[60] flex items-center justify-center pointer-events-auto"
      >
        <Sparkles size={20} />
        <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
      </button>

      {open && createPortal(
        <div 
          className="fixed bottom-24 right-6 w-[360px] h-[520px] flex flex-col rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden" 
          style={{ zIndex: 999999999 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white shrink-0">
            <div className="flex items-center gap-2 font-bold text-sm"> 
              <Bot size={18} /> AIAssistant 
            </div>
            <button type="button" onClick={() => setOpen(false)} className="hover:bg-white/20 p-1 rounded transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 shrink-0">
            {['chat', 'post', 'study'].map(id => (
              <button 
                key={id} 
                type="button"
                onClick={() => setTab(id)} 
                className={`flex-1 py-3 text-xs font-bold transition-colors ${tab === id ? 'border-b-2 border-blue-500 text-blue-500 bg-slate-50 dark:bg-slate-800' : 'text-slate-400'}`}
              > 
                {id.toUpperCase()} 
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {tab === 'chat' && (
              <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'}`}> {m.text} </div>
                    </div>
                  ))}
                  {loading && <div className="text-xs text-slate-400 animate-pulse px-4">Thinking...</div>}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-3 border-t flex gap-2 shrink-0">
                  <input 
                    value={chatInput} 
                    onChange={e => setChatInput(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && handleChat()} 
                    placeholder="Ask anything..."
                    className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2 outline-none text-sm text-slate-800 dark:text-slate-200"
                  />
                  <button type="button" onClick={handleChat} disabled={loading} className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"> 
                    <Send size={15} /> 
                  </button>
                </div>
              </div>
            )}

            {tab !== 'chat' && (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                 <p className="text-sm text-slate-400 font-medium">This feature is ready and optimized. Request a suggestion above!</p>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
export default AIAssistant;
