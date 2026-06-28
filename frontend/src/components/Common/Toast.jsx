import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const Toast = ({ message, type = 'info', duration = 5000, onClose, onClick }) => {
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

  const handleClick = () => {
    if (onClick) {
      onClick();
      handleClose();
    }
  };

  if (!isVisible) return null;

  const icons = {
    success: <CheckCircle size={20} className="text-green-500" />,
    error: <AlertCircle size={20} className="text-red-500" />,
    warning: <AlertTriangle size={20} className="text-orange-500" />,
    info: <Info size={20} className="text-blue-500" />,
  };

  const bgColors = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-400',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400',
    warning: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-900/30 text-orange-700 dark:text-orange-400',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/30 text-blue-700 dark:text-blue-400',
  };

  return (
    <div
      className={`max-w-md transform transition-all duration-300 ${
        isExiting
          ? 'translate-x-full opacity-0'
          : 'translate-x-0 opacity-100'
      }`}
    >
      <div
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick ? handleClick : undefined}
        onKeyDown={onClick ? (e) => e.key === 'Enter' && handleClick() : undefined}
        className={`flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md ${
          onClick ? 'cursor-pointer hover:scale-[1.01]' : ''
        } ${bgColors[type]}`}
      >
        <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          className="flex-shrink-0 text-current opacity-40 hover:opacity-100 transition-opacity"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    window.showToast = (message, type = 'info', duration = 5000, options = {}) => {
      const id = Date.now() + Math.random();
      const onClick = options.route
        ? () => navigate(options.route)
        : options.onClick || null;
      setToasts((prev) => [...prev, { id, message, type, duration, onClick }]);
    };

    return () => {
      delete window.showToast;
    };
  }, [navigate]);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <div className="fixed top-16 right-4 left-4 sm:left-auto z-50 p-0 space-y-2 pointer-events-none">
      <div className="flex flex-col items-end gap-2 pointer-events-auto max-w-md ml-auto">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClick={toast.onClick}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default Toast;
