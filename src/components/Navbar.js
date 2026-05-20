"use client";
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { User, LogOut, Menu, X, Flame } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [animatedCalories, setAnimatedCalories] = useState(0);

  // Load and animate calories from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("clashOfCardioProgression");
    let cal = 840;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.calories !== undefined) {
          cal = parsed.calories;
        }
      } catch (e) {}
    }

    if (cal > 0) {
      let start = 0;
      const end = cal;
      const duration = 1200; // 1.2 seconds animation
      const startTime = performance.now();

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = progress * (2 - progress); // Ease out quad
        setAnimatedCalories(Math.round(ease * end));

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
  }, []);

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '80px',
      background: 'rgba(2, 2, 5, 0.8)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 5%',
      zIndex: 1000,
    }}>
      <Link href="/" style={{ textDecoration: 'none' }}>
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="arcade-text" 
          style={{ fontSize: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <div style={{ width: '32px', height: '32px', background: '#39ff14', borderRadius: '6px', transform: 'rotate(45deg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ transform: 'rotate(-45deg)', color: '#000', fontWeight: 900, fontSize: '18px' }}>C</div>
          </div>
          <span style={{ letterSpacing: '1px', color: '#fff' }}>CLASH<span style={{ color: '#39ff14', textShadow: '0 0 10px rgba(57,255,20,0.5)' }}>OFCARDIO</span></span>
        </motion.div>
      </Link>
      
      {/* Desktop Menu */}
      <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }} className="desktop-menu">
        {['ABOUT', 'CONTACT', 'PREMIUM'].map((item) => (
          <Link 
            key={item}
            href={`/${item.toLowerCase()}`} 
            style={{ 
              color: item === 'PREMIUM' ? '#39ff14' : '#fff', 
              textDecoration: 'none', 
              fontSize: '13px', 
              fontWeight: 700, 
              opacity: 0.6,
              letterSpacing: '2px',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#39ff14'; }}
            onMouseOut={(e) => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.color = item === 'PREMIUM' ? '#39ff14' : '#fff'; }}
          >
            {item}
          </Link>
        ))}

        {/* Animated Calories Burned Display Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(57, 255, 20, 0.05)',
          border: '1px solid rgba(57, 255, 20, 0.2)',
          padding: '8px 16px',
          borderRadius: '50px',
          fontSize: '11px',
          fontWeight: 800,
          color: '#39ff14',
          fontFamily: 'var(--font-gaming)',
          boxShadow: '0 0 10px rgba(57, 255, 20, 0.1)',
          letterSpacing: '0.5px'
        }}>
          <Flame size={13} fill="#39ff14" color="#39ff14" />
          <span>{animatedCalories} KCAL</span>
        </div>
        
        {user ? (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '50px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <User size={14} color="#39ff14" />
              <span style={{ fontSize: '12px', color: '#fff', fontWeight: 800, letterSpacing: '1px' }}>{user.displayName?.toUpperCase() || 'PLAYER'}</span>
            </div>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              style={{
                background: 'rgba(255, 0, 60, 0.1)',
                border: '1px solid #ff4444',
                color: '#ff4444',
                padding: '10px 20px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <LogOut size={14} /> EXIT
            </motion.button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link href="/login" style={{ 
              color: '#fff', 
              textDecoration: 'none', 
              fontSize: '13px', 
              fontWeight: 800,
              padding: '12px 24px',
              opacity: 0.8
            }}>LOGIN</Link>
            <Link href="/register" className="glow-btn" style={{ 
              textDecoration: 'none', 
              fontSize: '13px', 
              padding: '12px 30px',
              borderRadius: '8px'
            }}>JOIN SQUAD</Link>
          </div>
        )}
      </div>

      {/* Mobile Toggle */}
      <button 
        style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'none' }}
        className="mobile-toggle"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      <style jsx>{`
        @media (max-width: 900px) {
          .desktop-menu { display: none !important; }
          .mobile-toggle { display: block !important; }
        }
      `}</style>
    </nav>
  );
}
