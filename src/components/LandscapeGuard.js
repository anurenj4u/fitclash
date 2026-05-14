"use client";
import React, { useEffect, useState } from 'react';

export default function LandscapeGuard({ children }) {
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const isMobile = window.innerWidth <= 1024;
      const isPortrait = window.innerHeight > window.innerWidth;
      setIsPortraitMobile(isMobile && isPortrait);
    };

    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  if (isPortraitMobile) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: '#050505',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        gap: '24px',
        padding: '20px',
        textAlign: 'center'
      }}>
        {/* Animated phone rotation icon */}
        <div style={{ animation: 'rotatePhone 1.5s ease-in-out infinite' }}>
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="10" width="40" height="60" rx="6" stroke="#39ff14" strokeWidth="3" fill="none"/>
            <circle cx="40" cy="62" r="3" fill="#39ff14"/>
            <rect x="33" y="14" width="14" height="3" rx="1.5" fill="#39ff14"/>
            {/* Rotation arrows */}
            <path d="M8 40 Q8 8 40 8" stroke="#00f2ff" strokeWidth="2.5" fill="none" strokeDasharray="4 3"/>
            <polygon points="40,2 40,14 47,8" fill="#00f2ff"/>
          </svg>
        </div>

        <div>
          <div style={{
            fontFamily: 'Arial, sans-serif',
            fontWeight: 900,
            fontSize: '22px',
            letterSpacing: '4px',
            color: '#39ff14',
            textTransform: 'uppercase',
            textShadow: '0 0 15px rgba(57,255,20,0.6)',
            marginBottom: '12px'
          }}>
            Rotate Your Device
          </div>
          <div style={{
            color: 'rgba(255,255,255,0.65)',
            fontSize: '14px',
            lineHeight: '1.6',
            maxWidth: '260px'
          }}>
            ClashofCardio is best played in <strong style={{ color: '#fff' }}>Landscape Mode</strong>.<br/>
            Please rotate your phone sideways to continue.
          </div>
        </div>

        <style>{`
          @keyframes rotatePhone {
            0%   { transform: rotate(0deg); }
            40%  { transform: rotate(90deg); }
            60%  { transform: rotate(90deg); }
            100% { transform: rotate(0deg); }
          }
        `}</style>
      </div>
    );
  }

  return children;
}
