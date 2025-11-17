import React from 'react';

const Loading = ({ size = 'md', fullScreen = false }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  const content = (
    <div className="relative">
      <div className={`${sizes[size]} rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin`} />
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        {content}
      </div>
    );
  }

  return content;
};

export default Loading;