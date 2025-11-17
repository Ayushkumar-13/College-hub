// FILE: frontend/src/components/Auth/AuthLayout.jsx

import React from "react";

const AuthLayout = ({ title, subtitle, children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-800 via-indigo-800 to-pink-700 p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md p-8 border border-white/20 animate-fadeIn">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-indigo-500 to-pink-500 rounded-3xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-3 shadow-lg">
            CS
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">{title}</h1>
          <p className="text-gray-500">{subtitle}</p>
        </div>

        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
