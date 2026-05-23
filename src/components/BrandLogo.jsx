import React from 'react'

export default function BrandLogo({ className = "w-8 h-8" }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Definitions for Gradients and Glows */}
      <defs>
        <linearGradient id="cyber-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" /> {/* Brand 500 */}
          <stop offset="100%" stopColor="#22d3ee" /> {/* Accent 400 */}
        </linearGradient>
        <linearGradient id="cyber-gradient-light" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#67e8f9" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="intense-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer Hexagon / Shield Shape */}
      <path 
        d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" 
        stroke="url(#cyber-gradient)" 
        strokeWidth="3" 
        fill="#0f172a" 
        fillOpacity="0.8"
        className="animate-[pulse_4s_ease-in-out_infinite]"
      />
      
      {/* Outer Rotating Radar Ring */}
      <circle 
        cx="50" cy="50" r="35" 
        stroke="url(#cyber-gradient)" 
        strokeWidth="1.5" 
        strokeDasharray="10 20 40 10" 
        strokeLinecap="round"
        fill="none" 
        className="animate-[spin_8s_linear_infinite] origin-center" 
        opacity="0.6"
      />

      {/* Internal Code Brackets < > */}
      <path 
        d="M 35 40 L 25 50 L 35 60" 
        stroke="url(#cyber-gradient-light)" 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        filter="url(#glow)"
      />
      <path 
        d="M 65 40 L 75 50 L 65 60" 
        stroke="url(#cyber-gradient-light)" 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        filter="url(#glow)"
      />

      {/* Center Lock / Core Element */}
      <rect x="40" y="45" width="20" height="18" rx="4" fill="url(#cyber-gradient)" filter="url(#glow)" />
      <path d="M 44 45 V 38 C 44 34.686 46.686 32 50 32 C 53.314 32 56 34.686 56 38 V 45" stroke="url(#cyber-gradient)" strokeWidth="4" strokeLinecap="round" fill="none" filter="url(#glow)"/>
      
      {/* Core Energy Dot */}
      <circle cx="50" cy="54" r="3" fill="#ffffff" filter="url(#intense-glow)" className="animate-[pulse_2s_ease-in-out_infinite]" />
      <circle cx="50" cy="54" r="1.5" fill="#ffffff" />
    </svg>
  )
}
