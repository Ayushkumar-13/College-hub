import React from 'react';
import { AlertCircle } from 'lucide-react';

const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="flex items-center gap-2 text-red-500 text-sm">
      <AlertCircle size={14} />
      <span>{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="ml-2 underline hover:text-red-600 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;