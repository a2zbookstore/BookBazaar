import React from 'react';
import favicon from '../../public/favicon.jpeg';

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
      {showText && (<></>
        // <div className="flex items-center group cursor-pointer">
        // //   <div className="tracking-tighter flex items-center">
        // //     <span className=" font-semibold font-serif text-xl text-red-500 tracking-[0.2em] uppercase ">
        // //       Book
        // //     </span>
        // //   </div>
        // </div>
      )}
      {/* Favicon Image with innovation */}
      <div
        className={`relative ${sizes[size]} flex items-center justify-center`}
        aria-label="A2Z Bookshop Logo"
        tabIndex={0}
      >
        <img
          src={favicon}
          alt="A2Z Bookshop Logo"
          className={`object-contain `}
        />
      </div>
      {/* Store Name */}
      {showText && (<></>
        // <div className="flex items-center group cursor-pointer">
        //   <div className="text-4xl tracking-tighter flex items-center">
        //     <span className="font-semibold font-serif text-2xl text-black-800 tracking-[0.2em] uppercase ">
        //       <span className="font-bold text-3xl text-primary-aqua">shop</span>
        //     </span>
        //   </div>

        //   {/* A subtle underline decoration */}
        //   <div
        //     className="h-[2px] w-0 group-hover:w-[calc(100vw-64px)] bg-primary-aqua transition-all duration-1000 absolute -bottom-1 left-8"
        //   ></div>
        // </div>
      )}
    </div>
  );
}