import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bot, X, Send, Sparkles, BookOpen, FileText, Loader2 } from 'lucide-react';
import { chatWithAI, suggestPost, getStudyHelp } from '@/api/aiApi';

const AIAssistant = () => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('chat');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Chat tab state
  const [messages, setMessages] = useState([{ role: 'model', text: '👋 Hi! I am CollegeBot. How can I help?' }]);
  const [chatInput, setChatInput] = useState('');
  const [history, setHistory] = useState([]);
  const chatEndRef = useRef(null);

  // Post Suggest tab state
  const [postTopic, setPostTopic] = useState('');
  const [postSuggestion, setPostSuggestion] = useState('');

  // Study Help tab state
  const [subject, setSubject] = useState('');
  const [question, setQuestion] = useState('');
  const [studyAnswer, setStudyAnswer] = useState('');

  useEffect(() => {
    if (open && tab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, tab]);

  const handleChat = async () => {
    if (!chatInput.trim() || loading) return;
    const text = chatInput.trim();
    setChatInput('');
    setError(null);
    setMessages(p => [...p, { role: 'user', text }]);
    setLoading(true);
    try {
      const res = await chatWithAI(text, history);
      setMessages(p => [...p, { role: 'model', text: res.reply }]);
      setHistory(p => [...p, { role: 'user', parts: text }, { role: 'model', parts: res.reply }]);
    } catch (err) {
      setError(err?.response?.data?.message || 'Chat service unavailable');
      setMessages(p => [...p, { role: 'model', text: '⚠️ Failed to get a response.' }]);
    } finally { setLoading(false); }
  };

  const handlePostSuggest = async () => {
    if (!postTopic.trim() || loading) return;
    setLoading(true);
    setError(null);
    setPostSuggestion('');
    try {
      const res = await suggestPost(postTopic.trim());
      setPostSuggestion(res.suggestion);
    } catch (err) {
      setError(err?.response?.data?.message || 'Suggestion service error');
    } finally { setLoading(false); }
  };

  const handleStudyHelp = async () => {
    if (!subject.trim() || !question.trim() || loading) return;
    setLoading(true);
    setError(null);
    setStudyAnswer('');
    try {
      const res = await getStudyHelp(subject.trim(), question.trim());
      setStudyAnswer(res.answer);
    } catch (err) {
      setError(err?.response?.data?.message || 'Study service error');
    } finally { setLoading(false); }
  };

  return (
    <>
      <button 
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }} 
        className="relative p-2 rounded-xl transition-all hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 z-[60] flex items-center justify-center pointer-events-auto"
      >
        <Sparkles size={20} />
        <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
      </button>

      {open && createPortal(
        <div 
          className="fixed bottom-24 right-6 w-[360px] h-[550px] flex flex-col rounded-2xl shadow-[0_30px_70px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pointer-events-auto overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300"
          style={{ zIndex: 999999999 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shrink-0">
            <div className="flex items-center gap-2 font-bold text-sm"> 
              <Bot size={18} /> CollegeBot 
            </div>
            <button type="button" onClick={() => setOpen(false)} className="hover:bg-white/20 p-1 rounded transition-colors text-white">
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 shrink-0">
            {['chat', 'post', 'study'].map(id => (
              <button 
                key={id} 
                type="button"
                onClick={() => { setTab(id); setError(null); }} 
                className={`flex-1 py-3 text-xs font-bold transition-all ${tab === id ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50/50 dark:bg-slate-800' : 'text-slate-400'}`}
              > 
                {id.toUpperCase()} 
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-white dark:bg-slate-900 font-sans">
            {error && <div className="bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 p-2 text-[10px] text-center font-medium border-b border-red-100 dark:border-red-900/20">{error}</div>}

            {tab === 'chat' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm border border-slate-200/50 dark:border-slate-700'}`}> {m.text} </div>
                    </div>
                  ))}
                  {loading && <div className="flex justify-start"><div className="bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2 flex items-center gap-2"><Loader2 size={12} className="animate-spin text-blue-600" /><span className="text-[10px] text-slate-500">Thinking...</span></div></div>}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-3 border-t flex gap-2 shrink-0 bg-slate-50/50 dark:bg-slate-900">
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChat()} placeholder="Ask me about college..." className="flex-1 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none text-sm text-slate-800 dark:text-slate-200 shadow-inner" />
                  <button type="button" onClick={handleChat} disabled={loading || !chatInput.trim()} className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-all shadow-lg active:scale-95"><Send size={16} /></button>
                </div>
              </div>
            )}

            {tab === 'post' && (
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-900/20"><p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2 font-medium"><FileText size={14} /> Post Idea Generator</p></div>
                <input value={postTopic} onChange={e => setPostTopic(e.target.value)} placeholder="Enter a topic (e.g. Finals Week)..." className="w-full bg-slate-100 dark:bg-slate-800 text-sm rounded-xl px-4 py-3 outline-none text-slate-800 dark:text-slate-200 border dark:border-slate-700 focus:border-blue-400" />
                <button onClick={handlePostSuggest} disabled={loading || !postTopic.trim()} className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold flex items-center justify-center gap-3 transition-all active:scale-95">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  Suggest Caption
                </button>
                {postSuggestion && <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm relative"><p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-italic line-clamp-6">"{postSuggestion}"</p><button onClick={() => navigator.clipboard.writeText(postSuggestion)} className="mt-3 text-[10px] text-blue-500 font-bold hover:underline">COPY TO CLIPBOARD</button></div>}
              </div>
            )}

            {tab === 'study' && (
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject (e.g. Calculus)..." className="w-full bg-slate-100 dark:bg-slate-800 text-sm rounded-xl px-4 py-3 outline-none text-slate-800 dark:text-slate-200 border dark:border-slate-700" />
                <textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="What do you need help with?..." className="w-full bg-slate-100 dark:bg-slate-800 text-sm rounded-xl px-4 py-3 outline-none resize-none text-slate-800 dark:text-slate-200 border dark:border-slate-700" rows={4} />
                <button onClick={handleStudyHelp} disabled={loading || !subject.trim() || !question.trim()} className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold flex items-center justify-center gap-3 active:scale-95">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <BookOpen size={16} />}
                  Get Explanation
                </button>
                {studyAnswer && <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{studyAnswer}</div>}
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
