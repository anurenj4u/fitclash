'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function ProfileSettings() {
  const router = useRouter();
  
  const [settings, setSettings] = useState({
    matchType: 'ai',
    distanceSquats: 12,
    distancePushups: 12,
    distanceJacks: 8
  });

  useEffect(() => {
    const saved = localStorage.getItem('fitclash_user_settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('fitclash_user_settings', JSON.stringify(settings));
    router.push('/');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#050508', color: '#fff', fontFamily: 'var(--font-gaming)', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 className="arcade-text" style={{ fontSize: 'clamp(24px, 5vw, 40px)', color: '#00f2ff', marginBottom: '40px', textShadow: '0 0 15px rgba(0,242,255,0.4)' }}>
        PROFILE & SETTINGS
      </h1>

      <div style={{
        background: 'rgba(10, 10, 15, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '30px',
        width: '100%',
        maxWidth: '500px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        {/* MATCH TYPE */}
        <div style={{ marginBottom: '30px' }}>
          <label style={{ fontSize: '12px', fontWeight: 900, color: '#39ff14', letterSpacing: '2px', display: 'block', marginBottom: '15px' }}>
            DEFAULT 1V1 MATCH TYPE
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            {[
              { id: 'ai', label: 'AI' },
              { id: 'online', label: 'ONLINE' },
              { id: 'friend', label: 'FRIEND' }
            ].map(m => {
              const isActive = settings.matchType === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setSettings(s => ({ ...s, matchType: m.id }))}
                  style={{
                    padding: '12px 10px',
                    borderRadius: '8px',
                    background: isActive ? 'rgba(57, 255, 20, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                    color: isActive ? '#39ff14' : 'rgba(255, 255, 255, 0.5)',
                    border: `1.5px solid ${isActive ? '#39ff14' : 'rgba(255, 255, 255, 0.05)'}`,
                    fontSize: '11px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: isActive ? '0 0 10px rgba(57,255,20,0.2)' : 'none'
                  }}
                >
                  {m.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* DISTANCES */}
        <div style={{ marginBottom: '30px' }}>
          <label style={{ fontSize: '12px', fontWeight: 900, color: '#00f2ff', letterSpacing: '2px', display: 'block', marginBottom: '15px' }}>
            DISTANCE MODIFIER PER REP (METERS)
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {[
              { id: 'distanceSquats', label: 'SQUATS', min: 1, max: 100 },
              { id: 'distancePushups', label: 'PUSHUPS', min: 1, max: 100 },
              { id: 'distanceJacks', label: 'JUMPING JACKS', min: 1, max: 100 }
            ].map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px 15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '12px', fontWeight: 800 }}>{item.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="number"
                    min={item.min}
                    max={item.max}
                    value={settings[item.id]}
                    onChange={(e) => {
                      let val = parseInt(e.target.value) || 0;
                      if (val > item.max) val = item.max;
                      setSettings(s => ({ ...s, [item.id]: val }));
                    }}
                    style={{
                      width: '60px',
                      background: 'rgba(0, 242, 255, 0.1)',
                      border: '1px solid #00f2ff',
                      color: '#fff',
                      padding: '8px',
                      borderRadius: '6px',
                      textAlign: 'center',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      fontFamily: 'var(--font-gaming)'
                    }}
                  />
                  <span style={{ fontSize: '12px', opacity: 0.6, fontWeight: 700 }}>M</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="glow-btn pulse-glow"
          style={{ width: '100%', padding: '15px', fontSize: '16px' }}
        >
          SAVE SETTINGS 💾
        </button>
        <button 
          onClick={() => router.push('/')}
          style={{ 
            width: '100%', 
            padding: '15px', 
            fontSize: '12px', 
            background: 'transparent', 
            border: 'none', 
            color: 'rgba(255,255,255,0.4)', 
            marginTop: '10px',
            cursor: 'pointer',
            fontWeight: 800
          }}
        >
          CANCEL & GO BACK
        </button>
      </div>
    </div>
  );
}
