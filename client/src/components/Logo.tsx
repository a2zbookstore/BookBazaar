import React from 'react';
import favicon from '../../public/favicon.jpeg';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export default function Logo({ size = 'md', showText = true }: LogoProps) {
  const sizes = {
    sm: 'w-12 h-12',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
  };

  return (
    <div className="flex items-center  gap-1">
      {showText && (
        <div className="flex items-center group cursor-pointer">
          <div className="tracking-tighter flex items-center">
            <span className=" font-semibold font-serif text-xl text-red-500 tracking-[0.2em] uppercase ">
              Book
            </span>
          </div>
        </div>
      )}
      {/* Favicon Image with innovation */}
      <div
        className={`relative ${sizes[size]} flex items-center justify-center rounded-full border-[1px] border-black shadow-lg transition-transform duration-300 hover:scale-110 bg-white`}
        aria-label="A2Z Bookshop Logo"
        tabIndex={0}
      >
        <img
          src={favicon}
          alt="A2Z Bookshop Logo"
          className={`object-contain w-full h-full rounded-full`}
        />
      </div>
      {/* Store Name */}
      {showText && (
        <div className="flex items-center group cursor-pointer">
          <div className="text-4xl tracking-tighter flex items-center">
            <span className="font-semibold font-serif text-2xl text-black-800 tracking-[0.2em] uppercase ">
              <span className="font-bold text-3xl text-primary-aqua">shop</span>
            </span>
          </div>

          {/* A subtle underline decoration */}
          <div
            className="h-[2px] w-0 group-hover:w-[calc(100vw-64px)] bg-primary-aqua transition-all duration-1000 absolute -bottom-1 left-8"
          ></div>
        </div>
      )}
    </div>
  );
}