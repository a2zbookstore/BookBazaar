import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  showText?: boolean;
}

export default function Logo({ size = 'md', showText = true }: LogoProps) {
  const sizes = {
    sm: 'w-12 h-12',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
    '2xl': 'w-24 h-24',
    '3xl': 'w-32 h-32',
  };

  return (
    <div className="flex items-center  gap-1">
      <div
        className={`relative ${sizes[size]} flex items-center justify-center`}
        aria-label="A2Z Bookshop Logo"
        tabIndex={0}
      >
        <img
          src="/favicon.jpeg"
          alt="A2Z Bookshop Logo"
          className={`object-contain `}
        />
      </div>
    </div>
  );
}