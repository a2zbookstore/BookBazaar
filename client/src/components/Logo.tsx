import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'white' | 'dark';
  showText?: boolean;
}

export default function Logo({ size = 'md', variant = 'default', showText = true }: LogoProps) {
  const sizes = {
    sm: { logo: 'w-8 h-8', text: 'text-lg' },
    md: { logo: 'w-12 h-12', text: 'text-2xl' },
    lg: { logo: 'w-16 h-16', text: 'text-3xl' },
    xl: { logo: 'w-24 h-24', text: 'text-5xl' }
  };

  const colors = {
    default: {
      primary: '#2563eb',
      secondary: '#dc2626',
      accent: '#059669',
      text: '#1f2937'
    },
    white: {
      primary: '#ffffff',
      secondary: '#f3f4f6',
      accent: '#e5e7eb',
      text: '#ffffff'
    },
    dark: {
      primary: '#1f2937',
      secondary: '#dc2626',
      accent: '#059669',
      text: '#1f2937'
    }
  };

  const theme = colors[variant];

  return (
    <div className="flex items-center gap-3">
      {/* Book Logo SVG */}
      <div className={`${sizes[size].logo} relative`}>
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full drop-shadow-lg"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Book Stack Base */}
          <rect 
            x="15" y="70" 
            width="70" height="8" 
            rx="2" 
            fill={theme.primary}
            opacity="0.8"
          />
          
          {/* Main Book */}
          <rect 
            x="20" y="40" 
            width="60" height="35" 
            rx="3" 
            fill={theme.primary}
            stroke={theme.accent}
            strokeWidth="1"
          />
          
          {/* Book Pages */}
          <rect 
            x="22" y="42" 
            width="56" height="31" 
            rx="2" 
            fill="#ffffff"
            opacity="0.9"
          />
          
          {/* Book Spine Lines */}
          <line 
            x1="25" y1="45" 
            x2="25" y2="70" 
            stroke={theme.accent} 
            strokeWidth="1"
          />
          
          {/* Second Book */}
          <rect 
            x="25" y="25" 
            width="50" height="30" 
            rx="3" 
            fill={theme.secondary}
            stroke={theme.accent}
            strokeWidth="1"
            opacity="0.9"
          />
          
          {/* Second Book Pages */}
          <rect 
            x="27" y="27" 
            width="46" height="26" 
            rx="2" 
            fill="#ffffff"
            opacity="0.8"
          />
          
          {/* Third Book (Small) */}
          <rect 
            x="30" y="15" 
            width="40" height="25" 
            rx="2" 
            fill={theme.accent}
            stroke={theme.primary}
            strokeWidth="1"
            opacity="0.8"
          />
          
          {/* Third Book Pages */}
          <rect 
            x="32" y="17" 
            width="36" height="21" 
            rx="1" 
            fill="#ffffff"
            opacity="0.7"
          />
          
          {/* Bookmark */}
          <rect 
            x="72" y="15" 
            width="4" height="15" 
            fill={theme.secondary}
          />
          <polygon 
            points="72,30 76,30 74,35" 
            fill={theme.secondary}
          />
          
          {/* Text Lines on Books */}
          <line x1="35" y1="48" x2="65" y2="48" stroke={theme.primary} strokeWidth="1" opacity="0.3"/>
          <line x1="35" y1="52" x2="60" y2="52" stroke={theme.primary} strokeWidth="1" opacity="0.3"/>
          <line x1="35" y1="56" x2="65" y2="56" stroke={theme.primary} strokeWidth="1" opacity="0.3"/>
          
          <line x1="35" y1="32" x2="60" y2="32" stroke={theme.accent} strokeWidth="1" opacity="0.3"/>
          <line x1="35" y1="36" x2="55" y2="36" stroke={theme.accent} strokeWidth="1" opacity="0.3"/>
          
          {/* A2Z Text on Top Book */}
          <text 
            x="50" y="28" 
            textAnchor="middle" 
            fontSize="8" 
            fill={theme.text}
            fontWeight="bold"
            fontFamily="serif"
          >
            A2Z
          </text>
        </svg>
      </div>

      {/* Store Name */}
      {showText && (
        <div className={`${sizes[size].text} font-bold`} style={{ color: theme.text }}>
          <span className="font-serif">A</span>
          <span className="text-red-600 font-serif">2</span>
          <span className="font-serif">Z</span>
          <span className="ml-2 font-sans tracking-wide">BOOKSHOP</span>
        </div>
      )}
    </div>
  );
}