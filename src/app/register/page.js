"use client";
import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
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
        <h1 className="arcade-text" style={{ fontSize: '28px', marginBottom: '10px' }}>CREATE <span style={{ color: 'var(--accent)' }}>PILOT</span></h1>
        <p style={{ opacity: 0.6, marginBottom: '35px', fontSize: '14px' }}>Join the elite league of AI athletes</p>

        <form onSubmit={handleRegister} style={{ textAlign: 'left' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent)', display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>PILOT NAME</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="NeonRacer"
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

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent)', display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>EMAIL ADDRESS</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pilot@fitclash.ai"
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
            {loading ? 'CREATING...' : 'START JOURNEY 🚀'}
          </button>
        </form>

        <p style={{ marginTop: '30px', fontSize: '14px', opacity: 0.7 }}>
          Already have an account? <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>Login Here</Link>
        </p>
      </div>
    </div>
  );
}
