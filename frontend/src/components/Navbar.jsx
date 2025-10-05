/*
 * FILE: frontend/src/components/Navbar.jsx
 * PURPOSE: Unified navigation component used across all pages
 */

import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Flag, Users, Bell, LogOut } from 'lucide-react';
import { useAuth, useNotification, useSocket } from '@/hooks';

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
    <>
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-slate-200 backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
                <div className="relative w-11 h-11 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  CS
                </div>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                College Social
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <div 
                className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} 
                title={connected ? 'Connected' : 'Disconnected'}
              ></div>
              
              <button 
                onClick={() => navigate('/notifications')}
                className="relative p-2.5 hover:bg-slate-100 rounded-xl transition-all duration-200 group active:scale-95"
                aria-label="Notifications"
              >
                <Bell size={22} className="text-slate-600 group-hover:text-slate-900 transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[20px] h-5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full flex items-center justify-center font-semibold px-1.5 shadow-lg animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              
              <button 
                onClick={handleLogout}
                className="p-2.5 hover:bg-red-50 rounded-xl text-slate-600 hover:text-red-600 transition-all duration-200 group active:scale-95"
                aria-label="Logout"
              >
                <LogOut size={22} className="group-hover:rotate-6 transition-transform" />
              </button>
              
              <button 
                onClick={() => navigate('/profile')}
                className="relative ml-1 group"
                aria-label="Profile"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
                <img 
                  src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'} 
                  alt={user?.name} 
                  className="relative w-10 h-10 rounded-xl object-cover ring-2 ring-slate-200 group-hover:ring-blue-400 transition-all duration-200 cursor-pointer"
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-[61px] z-40 shadow-sm backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-5 py-3.5 border-b-2 transition-all duration-200 font-medium whitespace-nowrap ${
                    isActive
                      ? 'border-blue-600 text-blue-600 bg-blue-50 rounded-t-lg shadow-sm font-semibold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg group'
                  }`}
                >
                  <span className={isActive ? '' : 'group-hover:scale-110 transition-transform'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;