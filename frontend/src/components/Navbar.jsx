/*
 * FILE: frontend/src/components/Navbar.jsx
 * PURPOSE: Unified navigation component used across all pages
 */

import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Flag, Users, Bell, LogOut } from 'lucide-react';
import { useAuth, useNotification, useSocket } from '@/hooks';
import ThemeToggle from './Common/ThemeToggle';
import AIAssistant from './Common/AIAssistant';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotification();
  const { connected } = useSocket();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: "/", icon: <Home size={20} />, label: "Feed" },
    { to: "/messages", icon: <MessageSquare size={20} />, label: "Messages" },
    { to: "/issues", icon: <Flag size={20} />, label: "Issues" },
    { to: "/contacts", icon: <Users size={20} />, label: "Contacts" },
  ];

  return (
    <header className="bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md bg-white/95 dark:bg-slate-900/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16">
        <div className="flex items-center justify-between h-full">
          {/* Logo Section */}
          <div className="flex items-center gap-2 shrink-0 cursor-pointer" onClick={() => navigate('/')}>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
              <div className="relative w-9 h-9 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-lg">
                CS
              </div>
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent hidden sm:block">
              College Social
            </h1>
          </div>
          
          {/* Main Navigation - Icons Only */}
          <nav className="flex items-center gap-1 md:gap-4 lg:gap-8">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  title={item.label}
                  className={`relative p-2.5 rounded-xl transition-all duration-200 group flex items-center justify-center ${
                    isActive
                      ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className={`${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>
                    {item.icon}
                  </span>
                  {isActive && (
                    <div className="absolute -bottom-1 left-2 right-2 h-0.5 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.5)]"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Action Section */}
          <div className="flex items-center gap-1 md:gap-3 shrink-0">
            <div className="hidden min-[400px]:block">
              <ThemeToggle />
            </div>
            
            {/* AI Assistant */}
            <AIAssistant />
            
            <button 
              onClick={() => navigate('/notifications')}
              className="relative p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 group active:scale-95"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={22} className="text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-sm">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            
            <button 
              onClick={handleLogout}
              className="hidden md:flex p-2.5 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl text-slate-500 hover:text-red-600 transition-all duration-200 group active:scale-95"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut size={22} />
            </button>
            
            <button 
              onClick={() => navigate('/profile')}
              className="relative ml-1 group"
              aria-label="Profile"
              title="Profile"
            >
              <img 
                src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'} 
                alt={user?.name} 
                className="w-9 h-9 rounded-xl object-cover ring-2 ring-slate-100 dark:ring-slate-800 group-hover:ring-blue-400 transition-all duration-200 cursor-pointer"
              />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
