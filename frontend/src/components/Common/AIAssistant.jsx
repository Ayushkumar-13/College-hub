// FILE: frontend/src/components/Common/AIAssistant.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, BookOpen, FileText, ChevronDown, Loader2 } from 'lucide-react';
import { chatWithAI, suggestPost, getStudyHelp } from '@/api/aiApi';

const TABS = [
  { id: 'chat',    label: 'Chat',         icon: <Bot size={14} /> },
  { id: 'post',    label: 'Post Ideas',   icon: <FileText size={14} /> },
  { id: 'study',   label: 'Study Help',   icon: <BookOpen size={14} /> },
];

const AIAssistant = () => {
  const [open, setOpen]         = useState(false);
  const [tab, setTab]           = useState('chat');
  const [loading, setLoading]   = useState(false);

  // Chat tab state
  const [messages, setMessages] = useState([
    { role: 'model', text: '👋 Hi! I\'m CollegeBot — your AI study buddy. How can I help you today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [history, setHistory]    = useState([]);

  // Post Suggest tab state
  const [postTopic, setPostTopic]       = useState('');
  const [postSuggestion, setPostSuggestion] = useState('');

  // Study Help tab state
  const [subject, setSubject]    = useState('');
  const [question, setQuestion]  = useState('');
  const [studyAnswer, setStudyAnswer] = useState('');

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (open && tab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, tab]);

  /* ── Chat ── */
  const handleChat = async () => {
    const text = chatInput.trim();
    if (!text || loading) return;
    setChatInput('');
    const userMsg = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const { reply } = await chatWithAI(text, history);
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
      setHistory(prev => [
        ...prev,
        { role: 'user',  parts: text },
        { role: 'model', parts: reply },
      ]);
    } catch {
      setMessages(prev => [...prev, { role: 'model', text: '⚠️ Something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  /* ── Post Suggest ── */
  const handlePostSuggest = async () => {
    if (!postTopic.trim() || loading) return;
    setLoading(true);
    setPostSuggestion('');
    try {
      const { suggestion } = await suggestPost(postTopic.trim());
      setPostSuggestion(suggestion);
    } catch {
      setPostSuggestion('⚠️ Could not generate suggestion. Try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Study Help ── */
  const handleStudyHelp = async () => {
    if (!subject.trim() || !question.trim() || loading) return;
    setLoading(true);
    setStudyAnswer('');
    try {
      const { answer } = await getStudyHelp(subject.trim(), question.trim());
      setStudyAnswer(answer);
    } catch {
      setStudyAnswer('⚠️ Could not fetch answer. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Open AI Assistant"
        title="AI Assistant"
        className="relative p-2.5 rounded-xl transition-all duration-200 group flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
      >
        <Sparkles size={20} className="group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full animate-pulse" />
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-20 right-4 z-[9999] w-[370px] max-h-[560px] flex flex-col rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden"
          style={{ animation: 'aiSlideIn 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <Bot size={16} className="text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-none">CollegeBot</p>
                <p className="text-white/70 text-[10px] mt-0.5">Powered by Gemini AI</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors p-1">
              <X size={18} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all duration-150 ${
                  tab === t.id
                    ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 bg-white dark:bg-slate-800'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col">

            {/* ── CHAT TAB ── */}
            {tab === 'chat' && (
              <>
                <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0" style={{ maxHeight: '360px' }}>
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                        m.role === 'user'
                          ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-tr-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm'
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                        <Loader2 size={14} className="animate-spin text-indigo-500" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">Thinking…</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleChat()}
                    placeholder="Ask anything…"
                    className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm rounded-xl px-3 py-2 outline-none placeholder-slate-400 dark:placeholder-slate-500"
                  />
                  <button
                    onClick={handleChat}
                    disabled={loading || !chatInput.trim()}
                    className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </>
            )}

            {/* ── POST IDEAS TAB ── */}
            {tab === 'post' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '420px' }}>
                <p className="text-xs text-slate-500 dark:text-slate-400">Enter a topic and get an AI-generated caption for your College Hub post.</p>
                <input
                  value={postTopic}
                  onChange={e => setPostTopic(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handlePostSuggest()}
                  placeholder="e.g. exam stress, campus food, internship..."
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm rounded-xl px-3 py-2 outline-none placeholder-slate-400"
                />
                <button
                  onClick={handlePostSuggest}
                  disabled={loading || !postTopic.trim()}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {loading ? 'Generating…' : 'Generate Caption'}
                </button>
                {postSuggestion && (
                  <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 border border-violet-100 dark:border-slate-700 rounded-xl p-3">
                    <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 mb-1 flex items-center gap-1">
                      <Sparkles size={11} /> Suggestion
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{postSuggestion}</p>
                    <button
                      onClick={() => { navigator.clipboard.writeText(postSuggestion); }}
                      className="mt-2 text-xs text-indigo-500 hover:underline"
                    >
                      Copy to clipboard
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── STUDY HELP TAB ── */}
            {tab === 'study' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '420px' }}>
                <p className="text-xs text-slate-500 dark:text-slate-400">Get a quick AI explanation on any subject.</p>
                <input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Subject (e.g. Mathematics, Physics...)"
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm rounded-xl px-3 py-2 outline-none placeholder-slate-400"
                />
                <textarea
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="Your question..."
                  rows={3}
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm rounded-xl px-3 py-2 outline-none placeholder-slate-400 resize-none"
                />
                <button
                  onClick={handleStudyHelp}
                  disabled={loading || !subject.trim() || !question.trim()}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <BookOpen size={14} />}
                  {loading ? 'Thinking…' : 'Get Answer'}
                </button>
                {studyAnswer && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl p-3">
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1">
                      <BookOpen size={11} /> Answer
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{studyAnswer}</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      <style>{`
        @keyframes aiSlideIn {
          from { opacity: 0; transform: translateY(16px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
};

export default AIAssistant;
