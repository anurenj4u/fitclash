"use client";
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Github, Twitter, Youtube, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      background: '#020205',
      padding: '80px 5% 40px',
      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
      color: '#fff',
      position: 'relative',
      zIndex: 10
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '60px',
        marginBottom: '60px'
      }}>
        <div style={{ maxWidth: '400px' }}>
          <div className="arcade-text" style={{ fontSize: '24px', marginBottom: '25px', fontWeight: 800 }}>
            CLASH<span style={{ color: 'var(--accent)' }}>OFCARDIO</span>
          </div>
          <p style={{ opacity: 0.6, fontSize: '16px', lineHeight: 1.8, marginBottom: '30px' }}>
            The premier AI fitness platform. Transform your training with intelligent tracking and performance analytics.
          </p>
          <div style={{ display: 'flex', gap: '20px' }}>
            {[Twitter, Github, Youtube, Instagram].map((Icon, i) => (
              <motion.a 
                key={i} 
                href="#" 
                whileHover={{ y: -3, color: 'var(--accent)' }} 
                style={{ color: '#fff', opacity: 0.6 }}
              >
                <Icon size={20} />
              </motion.a>
            ))}
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          <div>
            <h4 className="hud-text" style={{ marginBottom: '25px', fontSize: '12px', letterSpacing: '2px' }}>CORE</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {['ABOUT', 'CONTACT', 'CAREERS', 'PRESS'].map(item => (
                <li key={item} style={{ marginBottom: '15px' }}>
                  <Link href={`/${item.toLowerCase()}`} style={{ color: '#fff', opacity: 0.6, textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>{item}</Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="hud-text" style={{ marginBottom: '25px', fontSize: '12px', letterSpacing: '2px' }}>LEGAL</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {['PRIVACY', 'TERMS', 'REFUND'].map(item => (
                <li key={item} style={{ marginBottom: '15px' }}>
                  <Link href={`/${item.toLowerCase()}`} style={{ color: '#fff', opacity: 0.6, textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>{item}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <h4 className="hud-text" style={{ marginBottom: '25px', fontSize: '12px', letterSpacing: '2px' }}>NEWSLETTER</h4>
          <p style={{ opacity: 0.6, fontSize: '14px', marginBottom: '20px' }}>Get weekly performance tips and platform updates.</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              placeholder="EMAIL@DOMAIN.COM" 
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 20px', borderRadius: '8px', color: '#fff', width: '100%', fontSize: '12px' }} 
            />
            <button className="glow-btn" style={{ padding: '12px 20px', borderRadius: '8px', fontSize: '12px' }}>JOIN</button>
          </div>
        </div>
      </div>
      
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        paddingTop: '40px',
        textAlign: 'center',
        opacity: 0.4,
        fontSize: '11px',
        letterSpacing: '1px'
      }}>
        © {new Date().getFullYear()} CLASHOFCARDIO AI SYSTEMS. ENCRYPTED & SECURED.
      </div>
    </footer>
  );
}

