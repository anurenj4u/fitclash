"use client";
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, Menu, X, Flame } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { user, userData, logout } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [animatedCalories, setAnimatedCalories] = useState(0);
  const [level, setLevel] = useState(5);
  const [rank, setRank] = useState('SPRINTER');

  // Load and animate calories from localStorage or Firebase
  useEffect(() => {
    let cal = 0;
    if (userData && userData.calories !== undefined) {
      cal = userData.calories;
    }
    
    const saved = localStorage.getItem("clashOfCardioProgression");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.calories !== undefined && !userData?.calories) {
          cal = parsed.calories;
        }
        if (parsed.level !== undefined) setLevel(parsed.level);
        if (parsed.rank !== undefined) setRank(parsed.rank);
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
  }, [userData]);

  const isActive = (path) => pathname === path;

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '80px',
      background: 'rgba(5, 5, 8, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(57, 255, 20, 0.15)',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 5%',
      zIndex: 1000,
    }}>
      <Link href="/" style={{ textDecoration: 'none' }}>
        <motion.div 
          whileHover={{ scale: 1.03 }}
          className="arcade-text" 
          style={{ fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <div style={{ width: '30px', height: '30px', background: '#39ff14', borderRadius: '6px', transform: 'rotate(45deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(57, 255, 20, 0.3)' }}>
            <div style={{ transform: 'rotate(-45deg)', color: '#000', fontWeight: 900, fontSize: '16px' }}>C</div>
          </div>
          <span style={{ letterSpacing: '1.5px', color: '#fff', fontWeight: 800 }}>CLASH<span style={{ color: '#39ff14' }}>OFCARDIO</span></span>
        </motion.div>
      </Link>
      
      {/* Desktop Menu */}
      <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }} className="desktop-menu">
        {(userData?.isPremium ? ['ABOUT', 'CONTACT'] : ['ABOUT', 'CONTACT', 'PREMIUM']).map((item) => {
          const href = `/${item.toLowerCase()}`;
          const active = isActive(href);
          return (
            <Link 
              key={item}
              href={href} 
              style={{ 
                color: item === 'PREMIUM' ? '#39ff14' : '#fff', 
                textDecoration: 'none', 
                fontSize: '12px', 
                fontWeight: 800, 
                opacity: active ? 1 : 0.6,
                letterSpacing: '2px',
                transition: 'all 0.3s ease',
                position: 'relative',
                padding: '8px 0'
              }}
              onMouseOver={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#39ff14'; }}
              onMouseOut={(e) => { e.currentTarget.style.opacity = active ? '1' : '0.6'; e.currentTarget.style.color = item === 'PREMIUM' ? '#39ff14' : '#fff'; }}
            >
              {item}
              {active && (
                <motion.div 
                  layoutId="activeNav"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: '#39ff14',
                    boxShadow: '0 0 8px #39ff14',
                    borderRadius: '2px'
                  }}
                />
              )}
            </Link>
          );
        })}
        
        {user ? (
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(5, 5, 8, 0.8)',
              border: '1px solid rgba(57, 255, 20, 0.2)',
              padding: '6px 16px',
              borderRadius: '24px',
              boxShadow: '0 0 15px rgba(57, 255, 20, 0.08)'
            }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(57, 255, 20, 0.15)', border: '1.5px solid #39ff14', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 8px rgba(57, 255, 20, 0.3)' }}>
                <User size={12} color="#39ff14" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                <span style={{ fontSize: '10px', color: '#fff', fontWeight: 800, letterSpacing: '1.05px' }}>
                  {user.displayName?.toUpperCase() || user.email?.split('@')[0].toUpperCase() || 'ATHLETE'}
                </span>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span style={{ fontSize: '7px', color: '#39ff14', fontWeight: 900, background: 'rgba(57, 255, 20, 0.1)', padding: '1px 4px', borderRadius: '4px', border: '1px solid rgba(57, 255, 20, 0.2)' }}>
                    LVL {level}
                  </span>
                  <span style={{ fontSize: '7px', color: '#00f2ff', fontWeight: 900, background: 'rgba(0, 242, 255, 0.1)', padding: '1px 4px', borderRadius: '4px', border: '1px solid rgba(0, 242, 255, 0.2)' }}>
                    {rank}
                  </span>
                </div>
              </div>
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={logout}
              style={{
                background: 'rgba(255, 0, 60, 0.05)',
                border: '1px solid rgba(255, 68, 68, 0.3)',
                color: '#ff4444',
                padding: '8px 16px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
                fontFamily: 'var(--font-gaming)'
              }}
            >
              <LogOut size={12} /> EXIT
            </motion.button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <Link href="/login" style={{ 
              color: '#fff', 
              textDecoration: 'none', 
              fontSize: '12px', 
              fontWeight: 800,
              padding: '10px 16px',
              opacity: 0.7,
              letterSpacing: '1px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '0.7'}
            >LOGIN</Link>
            <Link href="/register" className="glow-btn" style={{ 
              textDecoration: 'none', 
              fontSize: '12px', 
              padding: '10px 24px',
              borderRadius: '24px',
              boxShadow: '0 0 15px rgba(57, 255, 20, 0.2)'
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

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: '80px',
              left: 0,
              right: 0,
              background: 'rgba(2, 2, 5, 0.98)',
              backdropFilter: 'blur(20px)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '30px 5%',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              zIndex: 999
            }}
          >
            {(userData?.isPremium ? ['ABOUT', 'CONTACT'] : ['ABOUT', 'CONTACT', 'PREMIUM']).map((item) => (
              <Link 
                key={item}
                href={`/${item.toLowerCase()}`} 
                onClick={() => setIsMobileMenuOpen(false)}
                style={{ 
                  color: item === 'PREMIUM' ? '#39ff14' : '#fff', 
                  textDecoration: 'none', 
                  fontSize: '16px', 
                  fontWeight: 800, 
                  letterSpacing: '2px',
                  padding: '10px 0',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.03)'
                }}
              >
                {item}
              </Link>
            ))}

             {user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <User size={16} color="#39ff14" />
                  <span style={{ fontSize: '14px', color: '#fff', fontWeight: 800, letterSpacing: '1px' }}>{user.displayName?.toUpperCase() || 'PLAYER'}</span>
                </div>
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                  style={{
                    background: 'rgba(255, 0, 60, 0.1)',
                    border: '1px solid #ff4444',
                    color: '#ff4444',
                    padding: '12px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <LogOut size={16} /> EXIT
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} style={{ 
                  color: '#fff', 
                  textDecoration: 'none', 
                  fontSize: '14px', 
                  fontWeight: 800,
                  textAlign: 'center',
                  padding: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px'
                }}>LOGIN</Link>
                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="glow-btn" style={{ 
                  textDecoration: 'none', 
                  fontSize: '14px', 
                  padding: '12px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>JOIN SQUAD</Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @media (max-width: 900px) {
          .desktop-menu { display: none !important; }
          .mobile-toggle { display: block !important; }
        }
      `}</style>
    </nav>
  );
}
