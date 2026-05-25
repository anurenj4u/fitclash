import React from 'react';

export const metadata = {
  title: "About ClashofCardio | The Future of AI Fitness",
  description: "Learn how ClashofCardio uses local browser-based computer vision and AI to gamify your cardio workouts. No expensive gym memberships required.",
};

export default function AboutPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 20px', lineHeight: '1.8', color: '#ffffff', fontFamily: 'var(--font-body)', background: '#050508' }}>
      
      {/* Title */}
      <h1 className="arcade-text" style={{ fontSize: '32px', marginBottom: '15px', textAlign: 'center', color: '#39ff14', textShadow: '0 0 20px rgba(57, 255, 20, 0.4)' }}>
        REDEFINING <span style={{ color: '#ffffff' }}>FITNESS</span>
      </h1>
      
      <p style={{ marginBottom: '45px', textAlign: 'center', opacity: 0.5, fontSize: '12px' }}>Alegitimate, high-fidelity AI wellness platform</p>

      {/* Main Mission */}
      <section style={{ marginBottom: '40px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '30px' }}>
        <h2 style={{ color: '#39ff14', fontSize: '18px', marginBottom: '15px', fontWeight: 800 }}>1. What is ClashofCardio?</h2>
        <p style={{ opacity: 0.8, fontSize: '14px', marginBottom: '15px' }}>
          ClashofCardio is a premium, arcade-style fitness gaming platform designed to transform boring, routine home workouts into addictive gamified athletic challenges.
        </p>
        <p style={{ opacity: 0.8, fontSize: '14px' }}>
          By merging next-generation AI computer-vision skeleton pose tracking with football runner mechanics (e.g., competing on running tracks, leveling characters, and building workout streaks), we make exercise feel as engaging and immersive as high-stakes console gaming.
        </p>
      </section>

      {/* Why We Built It */}
      <section style={{ marginBottom: '40px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '30px' }}>
        <h2 style={{ color: '#39ff14', fontSize: '18px', marginBottom: '15px', fontWeight: 800 }}>2. Our Mission</h2>
        <p style={{ opacity: 0.8, fontSize: '14px', marginBottom: '15px' }}>
          Traditional home workouts are often lonely, lack instant gamified feedback, and suffer from high dropout rates. Gym equipment is expensive, bulky, and restrictive.
        </p>
        <p style={{ opacity: 0.8, fontSize: '14px' }}>
          Our mission is to democratize highly accessible and rewarding fitness tracking globally. We wanted to build a program where **your body acts as the controller** itself—requiring zero hardware accessories, wearable sensors, or subscription lock-ins. All you need is a browser, a webcam, and a willingness to move.
        </p>
      </section>

      {/* Local AI Tech Details */}
      <section style={{ marginBottom: '40px', background: 'rgba(57, 255, 20, 0.02)', border: '1px solid rgba(57, 255, 20, 0.2)', borderRadius: '16px', padding: '30px' }}>
        <h2 style={{ color: '#39ff14', fontSize: '18px', marginBottom: '15px', fontWeight: 800 }}>3. Real-Time Form Verification</h2>
        <p style={{ opacity: 0.9, fontSize: '14px', marginBottom: '12px' }}>
          We employ custom JavaScript multi-threaded Web Workers executing browser-optimized **TensorFlow.js** models in the background.
        </p>
        <p style={{ opacity: 0.9, fontSize: '14px', margin: 0 }}>
          <strong>🔒 100% Privacy First:</strong> Unlike other vision products, we never stream, upload, or process visual frame logs on external servers. Not a single pixel ever leaves your device. All coordinates calculations happen locally in temporary RAM, safeguarding your home environment and family privacy completely.
        </p>
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
