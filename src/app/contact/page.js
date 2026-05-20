"use client";
import React from 'react';


export default function ContactPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 20px', color: '#ffffff', fontFamily: 'var(--font-body)', background: '#050508', textAlign: 'center' }}>
      
      {/* Title */}
      <h1 className="arcade-text" style={{ fontSize: '32px', marginBottom: '15px', color: '#39ff14', textShadow: '0 0 20px rgba(57, 255, 20, 0.4)' }}>
        CONTACT <span style={{ color: '#ffffff' }}>US</span>
      </h1>
      
      <p style={{ fontSize: '15px', marginBottom: '45px', opacity: 0.7, maxWidth: '600px', margin: '10px auto 45px auto', lineHeight: 1.6 }}>
        Have questions about camera calibration, billing queries, or technical tracking form form issues? Our team is standing by to help.
      </p>

      {/* Centered Email Support Card */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '45px' }}>
        
        {/* Email Support Card */}
        <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '40px', maxWidth: '480px', width: '100%', textAlign: 'center' }}>
          <h3 style={{ color: '#39ff14', fontSize: '18px', marginBottom: '12px', fontWeight: 800 }}>✉️ EMAIL SUPPORT</h3>
          <p style={{ opacity: 0.6, fontSize: '13px', marginBottom: '20px' }}>For technical queries, billing adjustments, or custom assistance.</p>
          <a href="mailto:clashofcardio@gmail.com" style={{ color: '#ffffff', fontSize: '22px', fontWeight: 900, textDecoration: 'none', wordBreak: 'break-all', display: 'block' }}>
            clashofcardio@gmail.com
          </a>
          <p style={{ opacity: 0.4, fontSize: '11px', marginTop: '15px' }}>Average response time: 24 hours</p>
        </div>

      </div>

      {/* Community Channels */}
      <section style={{ marginBottom: '50px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '30px' }}>
        <h3 style={{ color: '#39ff14', fontSize: '16px', marginBottom: '20px', fontWeight: 800, textAlign: 'center' }}>⚡ JOIN THE SQUAD COMMUNITY</h3>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
          {[
            { name: 'DISCORD', href: 'https://discord.gg/clashofcardio', desc: 'Active workout chat' },
            { name: 'TWITTER / X', href: 'https://twitter.com/clashofcardio', desc: 'Latest patch updates' },
            { name: 'INSTAGRAM', href: 'https://instagram.com/clashofcardio', desc: 'Workout highlights' }
          ].map(social => (
            <a 
              key={social.name}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                padding: '15px 25px',
                textDecoration: 'none',
                color: '#fff',
                minWidth: '160px',
                transition: 'all 0.2s ease',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#39ff14';
                e.currentTarget.style.background = 'rgba(57, 255, 20, 0.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '13px', color: '#39ff14', marginBottom: '2px' }}>{social.name}</div>
              <div style={{ opacity: 0.5, fontSize: '10px' }}>{social.desc}</div>
            </a>
          ))}
        </div>
      </section>

      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <a href="/" style={{
          textDecoration: 'none',
          color: '#000',
          background: '#39ff14',
          padding: '12px 35px',
          borderRadius: '30px',
          fontWeight: 800,
          fontFamily: 'var(--font-gaming)',
          boxShadow: '0 0 15px rgba(57, 255, 20, 0.3)',
          display: 'inline-block'
        }}>BACK TO HOME</a>
      </div>
    </div>
  );
}
