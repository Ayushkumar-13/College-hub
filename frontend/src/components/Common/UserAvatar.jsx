import React from 'react';
import { getInitials, hasUserAvatar } from '@/utils/avatarHelpers';

const SIZE_MAP = {
  '2xs': 'w-5 h-5 text-[9px]',
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-24 h-24 text-2xl',
  '2xl': 'w-40 h-40 text-4xl',
};

const ROUNDED_MAP = {
  full: 'rounded-full',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
};

export default function UserAvatar({
  name = 'User',
  avatar,
  src,
  size = 'md',
  rounded = 'full',
  className = '',
  alt,
}) {
  const imageSrc = src ?? avatar;
  const showImage = hasUserAvatar(imageSrc);
  const initials = getInitials(name);
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;
  const roundedClass = ROUNDED_MAP[rounded] || ROUNDED_MAP.full;
  const baseClass = `${sizeClass} ${roundedClass} shrink-0 ${className}`;

  if (showImage) {
    return (
      <img
        src={imageSrc}
        alt={alt ?? name}
        className={`${baseClass} object-cover`}
      />
    );
  }

  return (
    <div
      className={`${baseClass} flex items-center justify-center font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-200`}
      aria-label={alt ?? name}
      title={name}
    >
      {initials}
    </div>
  );
}
