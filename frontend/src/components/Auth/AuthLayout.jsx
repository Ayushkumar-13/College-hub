// FILE: frontend/src/components/Auth/AuthLayout.jsx

import React from "react";

const AuthLayout = ({ title, subtitle, children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 p-4 ">
      <div className="bg-surface/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md p-8 border border-border-card animate-fadeIn ">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-3 shadow-lg ring-4 ring-white/10">
            CS
          </div>
          <h1 className="text-3xl font-bold text-text-main mb-1">{title}</h1>
          <p className="text-text-dim/80">{subtitle}</p>
        </div>

        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
