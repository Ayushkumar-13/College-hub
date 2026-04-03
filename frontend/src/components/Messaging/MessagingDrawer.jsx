import React, { useState } from 'react';
import { MoreHorizontal, Edit, ChevronUp, ChevronDown, Search } from 'lucide-react';

const MessagingDrawer = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Dummy contacts for UI visual effect
  const dummyContacts = [
    { name: 'John Doe', role: 'Software Engineer', time: 'May 1', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' },
    { name: 'Alice Smith', role: 'Product Manager', time: 'Apr 28', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice' },
    { name: 'Michael Tech', role: 'Data Scientist', time: 'Apr 20', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael' },
    { name: 'Sarah Coding', role: 'UI/UX Designer', time: 'Mar 15', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
    { name: 'Robert Backend', role: 'DevOps Engineer', time: 'Feb 10', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert' }
  ];

  return (
    <div 
      className={`fixed bottom-0 right-4 w-[300px] bg-white dark:bg-slate-900 shadow-[0_0_10px_rgba(0,0,0,0.15)] rounded-t-xl z-[100] border border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out hidden lg:flex flex-col ${
        isOpen ? 'h-[500px]' : 'h-12'
      }`}
    >
      {/* Header section (Clickable to expand/collapse) */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="h-12 w-full flex items-center justify-between px-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition rounded-t-xl border-b border-transparent dark:border-transparent shrink-0"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden relative">
            <img 
              src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'} 
              alt="Avatar" 
              className="w-full h-full object-cover" 
            />
            {/* Green Online Dot */}
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-900"></div>
          </div>
          <span className="font-semibold text-[14px] text-slate-800 dark:text-slate-200">Messaging</span>
        </div>
        
        <div className="flex items-center text-slate-500 dark:text-slate-400 gap-1">
          <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition" onClick={(e) => e.stopPropagation()}>
            <MoreHorizontal size={16} />
          </button>
          <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition" onClick={(e) => e.stopPropagation()}>
            <Edit size={14} />
          </button>
          <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition">
            {isOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        </div>
      </div>

      {/* Body section (Visible only when Open) */}
      {isOpen && (
        <div className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          {/* Search Bar */}
          <div className="px-3 py-2 shrink-0">
            <div className="bg-slate-100 dark:bg-slate-800 w-full rounded-sm flex items-center px-2 py-1.5 border border-transparent focus-within:border-slate-300 dark:focus-within:border-slate-600 transition">
              <Search size={14} className="text-slate-500 mr-2" />
              <input 
                type="text" 
                placeholder="Search messages" 
                className="bg-transparent text-[13px] outline-none w-full text-slate-900 dark:text-slate-100 placeholder-slate-500"
              />
            </div>
          </div>

          {/* Contact List */}
          <div className="flex flex-col flex-1 overflow-y-auto hidden-scrollbar">
            {dummyContacts.map((contact, idx) => (
              <div 
                key={idx} 
                className="flex items-center px-3 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition gap-3"
              >
                <img src={contact.img} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                <div className="flex-1 min-w-0 border-b border-slate-100 dark:border-slate-800/50 pb-2">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="font-semibold text-[14px] text-slate-900 dark:text-slate-100 truncate">{contact.name}</span>
                    <span className="text-[11px] text-slate-500 whitespace-nowrap">{contact.time}</span>
                  </div>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 truncate">{contact.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagingDrawer;
