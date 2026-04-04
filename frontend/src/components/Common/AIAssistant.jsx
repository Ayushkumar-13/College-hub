import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, BookOpen, FileText, Loader2 } from 'lucide-react';
import { chatWithAI, suggestPost, getStudyHelp } from '@/api/aiApi';

const AIAssistant = () => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('chat');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([{ role: 'model', text: '👋 Hi! How can I help?' }]);
  const [chatInput, setChatInput] = useState('');
  const [history, setHistory] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (open && tab === 'chat') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      setMessages(p => [...p, { role: 'model', text: '⚠️ Error' }]);
    } finally { setLoading(false); }
  };

  return (
    <>
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-xl transition-all hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 z-50 flex items-center justify-center">
        <Sparkles size={20} />
        <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
      </button>

      {open && (
        <div className="fixed bottom-20 right-4 w-[350px] max-h-[500px] flex flex-col rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pointer-events-auto overflow-hidden" style={{ zIndex: 999999999 }}>
          <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white">
            <div className="flex items-center gap-2 font-bold text-sm"> <Bot size={18} /> CollegeBot </div>
            <button onClick={() => setOpen(false)}><X size={18} /></button>
          </div>
          <div className="flex border-b text-xs">
            {['chat', 'post', 'study'].map(id => (
              <button key={id} onClick={() => setTab(id)} className={`flex-1 py-2 ${tab === id ? 'border-b-2 border-blue-500 text-blue-500' : ''}`}> {id.toUpperCase()} </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-3 text-sm">
            {tab === 'chat' && messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} mb-2`}>
                <div className={`p-2 rounded-xl ${m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}> {m.text} </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          {tab === 'chat' && (
            <div className="p-2 border-t flex gap-2">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChat()} className="flex-1 bg-slate-100 dark:bg-slate-800 rounded px-2 py-1 outline-none" />
              <button onClick={handleChat} disabled={loading} className="p-2 bg-blue-500 text-white rounded"> <Send size={14} /> </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};
export default AIAssistant;
