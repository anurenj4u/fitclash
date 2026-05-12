"use client";
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px'
    }}>
      <div style={{
        background: 'var(--glass)',
        padding: '50px',
        borderRadius: '32px',
        border: '1px solid var(--glass-border)',
        maxWidth: '450px',
        width: '100%',
        textAlign: 'center',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
      }}>
        <h1 className="arcade-text" style={{ fontSize: '28px', marginBottom: '10px' }}>WELCOME <span style={{ color: 'var(--accent)' }}>BACK</span></h1>
        <p style={{ opacity: 0.6, marginBottom: '35px', fontSize: '14px' }}>Sign in to continue your fitness journey</p>

        <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent)', display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>EMAIL ADDRESS</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="commander@fitclash.ai"
              required
              style={{
                width: '100%',
                padding: '14px 20px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent)', display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '14px 20px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '16px',
                outline: 'none'
              }}
            />
          </div>

          {error && <p style={{ color: 'var(--danger)', fontSize: '12px', marginBottom: '20px', textAlign: 'center' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="glow-btn"
            style={{ width: '100%', fontSize: '18px', padding: '16px' }}
          >
            {loading ? 'LOGGING IN...' : 'ACCESS ACCOUNT ⚡'}
          </button>
        </form>

        <p style={{ marginTop: '30px', fontSize: '14px', opacity: 0.7 }}>
          New to FitClash? <Link href="/register" style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>Register Here</Link>
        </p>
      </div>
    </div>
  );
}
