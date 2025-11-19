// FILE: frontend/src/components/Common/Toast.jsx
import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const Toast = ({ message, type = 'info', duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  };

  if (!isVisible) return null;

  const icons = {
    success: <CheckCircle size={20} className="text-green-500" />,
    error: <AlertCircle size={20} className="text-red-500" />,
    warning: <AlertTriangle size={20} className="text-orange-500" />,
    info: <Info size={20} className="text-blue-500" />,
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-orange-50 border-orange-200',
    info: 'bg-blue-50 border-blue-200',
  };

  return (
    <div
      className={`fixed top-20 right-4 z-50 max-w-md transform transition-all duration-300 ${
        isExiting
          ? 'translate-x-full opacity-0'
          : 'translate-x-0 opacity-100'
      }`}
    >
      <div
        className={`flex items-start gap-3 p-4 rounded-xl shadow-lg border ${bgColors[type]} backdrop-blur-sm`}
      >
        <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
        <p className="flex-1 text-sm text-slate-700 font-medium">{message}</p>
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

// Toast Container Component
export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    // Global function to show toasts
    window.showToast = (message, type = 'info', duration = 5000) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type, duration }]);
    };

    return () => {
      delete window.showToast;
    };
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default Toast;