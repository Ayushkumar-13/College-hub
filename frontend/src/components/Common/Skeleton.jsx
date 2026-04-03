/**
 * FILE: frontend/src/components/Common/Skeleton.jsx
 * PURPOSE: Reusable skeleton loader for production-level loading effects
 */
import React from 'react';

const Skeleton = ({ className = '', variant = 'text', width = 'w-full', height = 'h-4' }) => {
  const baseClasses = 'animate-pulse bg-slate-200 dark:bg-slate-800 transition-colors duration-300';
  
  const variants = {
    text: `rounded ${height}`,
    circle: 'rounded-full w-12 h-12',
    rectangle: `rounded-lg ${height}`,
    avatar: 'rounded-full w-10 h-10',
    header: 'rounded-lg h-8',
    card: 'rounded-2xl h-48',
  };

  return (
    <div 
      className={`${baseClasses} ${variants[variant] || ''} ${width} ${className}`}
      aria-hidden="true"
    />
  );
};

export default Skeleton;
