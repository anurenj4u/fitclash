"use client";
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { User, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
          <div style={{ width: '32px', height: '32px', background: 'var(--accent)', borderRadius: '6px', transform: 'rotate(45deg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ transform: 'rotate(-45deg)', color: '#000', fontWeight: 900, fontSize: '18px' }}>C</div>
          </div>
          <span style={{ letterSpacing: '1px' }}>CLASH<span style={{ color: 'var(--accent)', textShadow: '0 0 10px var(--accent-glow)' }}>OFCARDIO</span></span>
        </motion.div>
      </Link>
      
      {/* Desktop Menu */}
      <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }} className="desktop-menu">
        {['ABOUT', 'CONTACT', 'PREMIUM'].map((item) => (
          <Link 
            key={item}
            href={`/${item.toLowerCase()}`} 
            style={{ 
              color: item === 'PREMIUM' ? 'var(--accent)' : '#fff', 
              textDecoration: 'none', 
              fontSize: '13px', 
              fontWeight: 700, 
              opacity: 0.6,
              letterSpacing: '2px',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--accent)'; }}
            onMouseOut={(e) => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.color = item === 'PREMIUM' ? 'var(--accent)' : '#fff'; }}
          >
            {item}
          </Link>
        ))}
        
        {user ? (
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '50px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <User size={14} color="var(--accent)" />
              <span style={{ fontSize: '12px', color: '#fff', fontWeight: 800, letterSpacing: '1px' }}>{user.displayName?.toUpperCase() || 'PLAYER'}</span>
            </div>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              style={{
                background: 'rgba(255, 0, 60, 0.1)',
                border: '1px solid var(--danger)',
                color: 'var(--danger)',
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

